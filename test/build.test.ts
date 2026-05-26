import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { describe, it, expect } from "vitest";

import { buildGraph } from "../src/build.js";
import { toDot, toSummary } from "../src/render.js";
import { parseRecords } from "../src/cli.js";
import * as api from "../src/index.js";
import type { RagRecord } from "../src/types.js";

const here = dirname(fileURLToPath(import.meta.url));
const records = (): RagRecord[] =>
  parseRecords(readFileSync(join(here, "..", "fixtures", "records.jsonl"), "utf8"));

const node = (g: api.EvidenceGraph, id: string) => g.nodes.find((n) => n.id === id)!;

describe("buildGraph", () => {
  const g = buildGraph(records());

  it("counts retrievals and citations per doc", () => {
    const d12 = node(g, "doc-12");
    expect(d12.timesRetrieved).toBe(2);
    expect(d12.timesCited).toBe(2);
    expect(d12.avgScore).toBeCloseTo(0.895, 3);
  });

  it("flags phantom (cited-but-never-retrieved) docs", () => {
    const phantom = node(g, "doc-99");
    expect(phantom.phantom).toBe(true);
    expect(phantom.timesRetrieved).toBe(0);
    expect(g.stats.phantomDocuments).toBe(1);
    expect(g.stats.ungroundedCitations).toBe(1);
  });

  it("lists retrieved-but-never-cited docs", () => {
    // doc-3 was retrieved once, never cited
    expect(g.stats.neverCited).toContain("doc-3");
    expect(node(g, "doc-3").utilization).toBe(0);
  });

  it("builds co-citation edges with weights", () => {
    // doc-12 + doc-7 cited together in record 1
    const e = g.edges.find(
      (x) => (x.source === "doc-7" && x.target === "doc-12") || (x.source === "doc-12" && x.target === "doc-7")
    );
    expect(e?.weight).toBe(1);
    // doc-7 + doc-30 cited together in record 4
    expect(g.edges.some((x) => [x.source, x.target].sort().join() === "doc-30,doc-7")).toBe(true);
  });

  it("computes corpus stats", () => {
    expect(g.stats.records).toBe(4);
    expect(g.stats.totalCitations).toBe(7);
    expect(g.stats.documents).toBe(g.nodes.length);
  });

  it("sorts nodes by citations desc", () => {
    expect(g.nodes[0]!.timesCited).toBeGreaterThanOrEqual(g.nodes[g.nodes.length - 1]!.timesCited);
  });

  it("dedupes repeated citations within a record", () => {
    const gg = buildGraph([{ retrieved: [{ id: "a" }], citations: ["a", "a", "a"] }]);
    expect(node(gg, "a").timesCited).toBe(1);
  });

  it("caps utilization at 1", () => {
    const gg = buildGraph([
      { retrieved: [{ id: "a" }], citations: ["a"] },
      { retrieved: [], citations: ["a"] }
    ]);
    expect(node(gg, "a").utilization).toBeLessThanOrEqual(1);
  });

  it("throws on bad input", () => {
    expect(() => buildGraph(null as unknown as RagRecord[])).toThrow(/array/);
    expect(() => buildGraph([{ retrieved: undefined as unknown as [] }])).toThrow(/retrieved/);
  });
});

describe("render", () => {
  const g = buildGraph(records());
  it("emits Graphviz DOT with phantom styling", () => {
    const dot = toDot(g);
    expect(dot.startsWith("graph evidence {")).toBe(true);
    expect(dot).toContain('"doc-99"');
    expect(dot).toMatch(/"doc-99".*color=red/);
    expect(dot).toContain("--"); // an edge
  });
  it("summary names top cited + phantom", () => {
    const s = toSummary(g);
    expect(s).toContain("evidence graph: 4 records");
    expect(s).toContain("PHANTOM");
  });
});

describe("parseRecords + API", () => {
  it("parses array + jsonl", () => {
    expect(parseRecords('[{"retrieved":[]}]')).toHaveLength(1);
    expect(parseRecords('{"retrieved":[]}\n{"retrieved":[]}')).toHaveLength(2);
  });
  it("throws on bad jsonl line", () => {
    expect(() => parseRecords('{"retrieved":[]}\n{oops')).toThrow(/line 2/);
  });
  it("re-exports surface", () => {
    expect(typeof api.buildGraph).toBe("function");
    expect(typeof api.toDot).toBe("function");
  });
});
