// Build a corpus-level citation/evidence graph from many RAG interactions.
// Input is compatible with rag-evidence-trace-linker's RagRecord (the trace
// fields are optional here — this is the aggregate view, not the per-call one).

export interface RetrievedDoc {
  id: string;
  source?: string;
  score?: number;
}

export interface RagRecord {
  /** Optional id of the interaction/answer. */
  id?: string;
  query?: string;
  retrieved: RetrievedDoc[];
  /** Document ids the answer cited. */
  citations?: string[];
}

export interface DocNode {
  id: string;
  source?: string;
  timesRetrieved: number;
  timesCited: number;
  /** Mean retrieval score across appearances, when scores are present. */
  avgScore?: number;
  /** True when this doc was cited but never retrieved (a phantom citation). */
  phantom: boolean;
  /** Of the times this doc was retrieved, the fraction it was cited
   *  (timesCited/timesRetrieved, capped at 1; 0 when never retrieved). */
  utilization: number;
}

/** Undirected co-citation edge: two docs cited together in one answer. */
export interface CoCitationEdge {
  source: string;
  target: string;
  /** Number of answers that cited both docs. */
  weight: number;
}

export interface EvidenceGraph {
  nodes: DocNode[];
  edges: CoCitationEdge[];
  stats: GraphStats;
}

export interface GraphStats {
  records: number;
  documents: number;
  phantomDocuments: number;
  totalCitations: number;
  ungroundedCitations: number;
  /** Doc ids retrieved but never cited across the whole corpus. */
  neverCited: string[];
}
