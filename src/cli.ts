#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

import { buildGraph } from "./build.js";
import { toDot, toSummary } from "./render.js";
import type { RagRecord } from "./types.js";

type Format = "json" | "dot" | "summary";
const FORMATS: Format[] = ["json", "dot", "summary"];

interface Args {
  source?: string;
  format: Format;
  out?: string;
  help: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { format: "summary", help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "-h" || a === "--help") args.help = true;
    else if (a === "--format") {
      const v = argv[++i] as Format;
      if (!FORMATS.includes(v)) throw new Error(`--format must be one of: ${FORMATS.join(", ")}`);
      args.format = v;
    } else if (a === "--out") args.out = argv[++i];
    else if (!a.startsWith("-")) args.source = a;
    else throw new Error(`Unknown option: ${a}`);
  }
  return args;
}

/** Parse a JSON array or JSONL of RAG records. */
export function parseRecords(raw: string): RagRecord[] {
  const t = raw.trim();
  if (t.startsWith("[")) return JSON.parse(t) as RagRecord[];
  if (t.startsWith("{") && !t.includes("\n")) return [JSON.parse(t) as RagRecord];
  return t
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l, i) => {
      try {
        return JSON.parse(l) as RagRecord;
      } catch {
        throw new Error(`invalid JSON on line ${i + 1}`);
      }
    });
}

const HELP = `rag-evidence-graph — build a citation/evidence graph from RAG interactions

Usage:
  rag-evidence-graph <records.json|.jsonl> [--format <fmt>] [--out <file>]

Input: a JSON array or JSONL of RAG records:
  { "retrieved": [{ "id", "source"?, "score"? }], "citations"?: ["id", ...] }

Options:
  --format <fmt>   summary | json | dot   (default summary)
  --out <file>     Write output to a file (default: stdout).
  -h, --help       Show this help.

json = { nodes, edges, stats }; dot = Graphviz (phantom citations in red).
Exit codes: 0 ok, 2 usage/IO error.`;

export function run(argv: string[]): number {
  let args: Args;
  try {
    args = parseArgs(argv);
  } catch (e) {
    process.stderr.write(`${(e as Error).message}\n`);
    return 2;
  }
  if (args.help || !args.source) {
    process.stdout.write(`${HELP}\n`);
    return args.help ? 0 : 2;
  }
  let output: string;
  try {
    const graph = buildGraph(parseRecords(readFileSync(args.source, "utf8")));
    output =
      args.format === "json"
        ? JSON.stringify(graph, null, 2)
        : args.format === "dot"
          ? toDot(graph)
          : toSummary(graph);
  } catch (e) {
    process.stderr.write(`error: ${(e as Error).message}\n`);
    return 2;
  }
  if (args.out) {
    writeFileSync(args.out, `${output}\n`, "utf8");
    process.stdout.write(`wrote ${args.format} to ${args.out}\n`);
  } else {
    process.stdout.write(`${output}\n`);
  }
  return 0;
}

const invokedDirectly =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  process.exit(run(process.argv.slice(2)));
}
