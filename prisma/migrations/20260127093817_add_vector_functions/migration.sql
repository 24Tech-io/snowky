-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create IVFFlat index for approximate nearest neighbor search
-- Adjust lists based on your data size (sqrt(n) is a good starting point)
CREATE INDEX IF NOT EXISTS embedding_idx 
ON "DocumentChunk" 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create function for similarity search
CREATE OR REPLACE FUNCTION search_embeddings(
  query_embedding vector(768),
  match_project_id TEXT,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id TEXT,
  document_id TEXT,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc."documentId",
    dc.content,
    dc.metadata,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM "DocumentChunk" dc
  JOIN "Document" d ON dc."documentId" = d.id
  WHERE d."projectId" = match_project_id
    AND d.status = 'READY'
    AND dc.embedding IS NOT NULL
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create function for hybrid search (semantic + keyword)
CREATE OR REPLACE FUNCTION hybrid_search(
  query_embedding vector(768),
  query_text TEXT,
  match_project_id TEXT,
  semantic_weight FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  id TEXT,
  document_id TEXT,
  content TEXT,
  metadata JSONB,
  semantic_score FLOAT,
  keyword_score FLOAT,
  combined_score FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH semantic_results AS (
    SELECT
      dc.id,
      dc."documentId",
      dc.content,
      dc.metadata,
      1 - (dc.embedding <=> query_embedding) AS semantic_score
    FROM "DocumentChunk" dc
    JOIN "Document" d ON dc."documentId" = d.id
    WHERE d."projectId" = match_project_id
      AND d.status = 'READY'
      AND dc.embedding IS NOT NULL
    ORDER BY dc.embedding <=> query_embedding
    LIMIT match_count * 2
  ),
  keyword_results AS (
    SELECT
      dc.id,
      ts_rank(to_tsvector('english', dc.content), plainto_tsquery('english', query_text)) AS keyword_score
    FROM "DocumentChunk" dc
    JOIN "Document" d ON dc."documentId" = d.id
    WHERE d."projectId" = match_project_id
      AND d.status = 'READY'
      AND to_tsvector('english', dc.content) @@ plainto_tsquery('english', query_text)
  )
  SELECT
    sr.id,
    sr."documentId" AS document_id,
    sr.content,
    sr.metadata,
    sr.semantic_score,
    COALESCE(kr.keyword_score, 0) AS keyword_score,
    (sr.semantic_score * semantic_weight + COALESCE(kr.keyword_score, 0) * (1 - semantic_weight)) AS combined_score
  FROM semantic_results sr
  LEFT JOIN keyword_results kr ON sr.id = kr.id
  ORDER BY combined_score DESC
  LIMIT match_count;
END;
$$;