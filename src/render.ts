import type { EvidenceGraph } from "./types.js";

const q = (s: string): string => `"${s.replace(/"/g, '\\"')}"`;

/** Render the co-citation graph as Graphviz DOT (undirected). */
export function toDot(graph: EvidenceGraph): string {
  const lines: string[] = ["graph evidence {", "  node [shape=box];"];
  for (const n of graph.nodes) {
    const label = `${n.id}\\nR:${n.timesRetrieved} C:${n.timesCited}`;
    const attrs = [`label=${q(label)}`];
    if (n.phantom) attrs.push("color=red", "style=dashed");
    else if (n.timesCited === 0) attrs.push("color=gray", "fontcolor=gray");
    lines.push(`  ${q(n.id)} [${attrs.join(", ")}];`);
  }
  for (const e of graph.edges) {
    lines.push(`  ${q(e.source)} -- ${q(e.target)} [label=${q(String(e.weight))}, penwidth=${1 + e.weight}];`);
  }
  lines.push("}");
  return lines.join("\n");
}

/** Render a short human-readable summary. */
export function toSummary(graph: EvidenceGraph): string {
  const s = graph.stats;
  const top = graph.nodes
    .filter((n) => n.timesCited > 0)
    .slice(0, 5)
    .map((n) => `  ${n.id} — cited ${n.timesCited}, retrieved ${n.timesRetrieved}${n.phantom ? " (PHANTOM)" : ""}`);
  const lines = [
    `evidence graph: ${s.records} records, ${s.documents} documents`,
    `citations: ${s.totalCitations} total, ${s.ungroundedCitations} ungrounded across ${s.phantomDocuments} phantom doc(s)`,
    `never cited (retrieved but unused): ${s.neverCited.length}`,
    `co-citation edges: ${graph.edges.length}`,
    "top cited:",
    ...(top.length ? top : ["  (none)"])
  ];
  return lines.join("\n");
}
