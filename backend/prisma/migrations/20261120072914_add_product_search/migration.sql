
CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- Accent folding, so "crepe" finds "Crêpe".
CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE OR REPLACE FUNCTION search_unaccent(text) RETURNS text
  LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
  AS $$ SELECT public.unaccent('public.unaccent'::regdictionary, $1) $$;

-- CreateTable
CREATE TABLE "SearchQuery" (
    "id" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "resultCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchQuery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SearchQuery_createdAt_idx" ON "SearchQuery"("createdAt");

-- CreateIndex
CREATE INDEX "SearchQuery_term_idx" ON "SearchQuery"("term");

-- Weighted full-text document: name > fabric type and material > description.
CREATE INDEX "Product_search_document_idx" ON "Product" USING GIN ((
  setweight(to_tsvector('english', search_unaccent(coalesce("name", ''))), 'A') ||
  setweight(to_tsvector('english', search_unaccent(coalesce("fabricType", '') || ' ' || coalesce("materialComposition", ''))), 'B') ||
  setweight(to_tsvector('english', search_unaccent(coalesce("description", ''))), 'C')
));

CREATE INDEX "Product_name_trgm_idx" ON "Product" USING GIN ((search_unaccent(lower("name"))) gin_trgm_ops);
