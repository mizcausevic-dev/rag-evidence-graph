# Security Policy

`rag-evidence-graph` is an offline transformer. It reads RAG records you supply
(document ids, sources, scores, citations) and emits a graph (JSON / Graphviz
DOT) and summary. It performs no network calls and invokes no LLM or retriever.

It reads only ids, sources, and scores — never document content. Avoid placing
sensitive content in the `source` field if graphs will be shared.

## Supported versions

Only the latest tagged release is supported.

## Reporting a vulnerability

Please use GitHub Security Advisories for private disclosure:

- [Open a security advisory](https://github.com/mizcausevic-dev/rag-evidence-graph/security/advisories/new)

Do not file public issues for security reports.
