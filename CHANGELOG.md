# Changelog

## v0.1.0 — 2026-05-25

- Initial release: build a corpus-level citation/evidence graph from RAG interactions.
- Document nodes with retrieval/citation counts, average score, utilization, and a phantom (cited-but-never-retrieved) flag; weighted co-citation edges; corpus stats (ungrounded citations, phantom docs, never-cited docs).
- Outputs: JSON graph, Graphviz DOT (phantom docs red, never-cited gray), and a human summary.
- Consumes the same RAG record shape as `rag-evidence-trace-linker` (per-call evidence → corpus-level graph).
- Library API (`buildGraph`, `toDot`, `toSummary`) + CLI (`rag-evidence-graph`, `--format json|dot|summary`).
- Node 20/22 CI (lint, typecheck, coverage, build, demo, `npm audit`), AGPL-3.0-or-later, Dependabot.
