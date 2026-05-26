# rag-evidence-graph

Build a **corpus-level citation/evidence graph** from many RAG interactions. Where [`rag-evidence-trace-linker`](https://github.com/mizcausevic-dev/rag-evidence-trace-linker) checks one answer's citations, this aggregates across a whole run: which documents carry your answers, which are retrieved but never used, and which citations are **phantoms** (cited but never retrieved).

Opens the knowledge-graph / evidence-infrastructure lane of the [Kinetic Gain](https://suite.kineticgain.com) portfolio. It consumes the same RAG record shape as the trace-linker, so per-call evidence and corpus-level evidence come from one pipeline.

## Why

Per-answer citation checks catch individual hallucinated citations; they don't tell you about the *corpus*. Over a thousand answers, which three documents do half your citations lean on (a fragility risk)? Which retrieved docs never get cited (dead weight in the index)? Which doc ids show up in citations but never in retrieval (a systematic phantom-citation pattern)? This builds the graph that answers those — documents as nodes, co-citations as edges, with the phantom and never-cited signals surfaced.

Pure and deterministic — no network, no LLM, no document content (only ids, sources, scores).

## Install

```bash
npm install -g rag-evidence-graph   # CLI
npm install rag-evidence-graph      # library
```

Requires Node ≥ 20.

## CLI

```bash
rag-evidence-graph records.jsonl                    # human summary
rag-evidence-graph records.jsonl --format json      # { nodes, edges, stats }
rag-evidence-graph records.jsonl --format dot | dot -Tsvg -o evidence.svg
```

Input is a JSON array or JSONL of RAG records: `{ "retrieved": [{ "id", "source"?, "score"? }], "citations"?: ["id"] }`.

## Library

```ts
import { buildGraph, toDot } from "rag-evidence-graph";

const graph = buildGraph(records);
console.log(graph.stats.phantomDocuments, graph.stats.neverCited);
const svgSource = toDot(graph);
```

## What the graph captures

- **Doc nodes** — `timesRetrieved`, `timesCited`, `avgScore`, `utilization` (cited/retrieved), and a `phantom` flag (cited but never retrieved).
- **Co-citation edges** — undirected, weighted by how many answers cited both documents together (find the document clusters your answers actually rely on).
- **Stats** — total/ungrounded citations, phantom-document count, and the list of retrieved-but-never-cited docs.

The Graphviz `dot` output styles phantom docs in red and never-cited docs in gray, so the failure modes are visible at a glance.

## License

AGPL-3.0-or-later — see [LICENSE](LICENSE).
