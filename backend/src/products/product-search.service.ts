import { Injectable, Logger } from '@nestjs/common';
import { Prisma, ProductStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';



/** Weighted document: name > fabric type and material > description. */
const SEARCH_DOCUMENT = Prisma.raw(`(
  setweight(to_tsvector('english', search_unaccent(coalesce(p."name", ''))), 'A') ||
  setweight(to_tsvector('english', search_unaccent(coalesce(p."fabricType", '') || ' ' || coalesce(p."materialComposition", ''))), 'B') ||
  setweight(to_tsvector('english', search_unaccent(coalesce(p."description", ''))), 'C')
)`);

/** Accent-folded, lower-cased name for trigram matching. */
const SEARCH_NAME = Prisma.raw(`search_unaccent(lower(p."name"))`);

/**
 * Minimum trigram word similarity for a name to count as a near-miss. The
 * Postgres default (0.6) drops one-letter typos in short words, e.g.
 * "harvst" vs "harvest" scores 0.57.
 */
const TYPO_THRESHOLD = '0.5';

/** Hard cap on ids pulled for one search; the catalogue is far smaller. */
const MAX_MATCHES = 500;

export const SEARCH_TERM_MIN = 2;
export const SEARCH_TERM_MAX = 80;

interface MatchOptions {
  /** Only products in this status. Omit to include every non-archived one. */
  status?: ProductStatus;
  limit?: number;
}

/**
 * Ranked product search on Postgres: full-text (with prefix matching, so
 * results appear while typing) plus trigram similarity on the name for
 * misspellings. All search SQL lives here, so moving to a dedicated engine
 * later only means replacing this class.
 */
@Injectable()
export class ProductSearchService {
  private readonly logger = new Logger(ProductSearchService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Trim, lower-case and collapse whitespace. */
  normalize(raw: string): string {
    return raw.trim().replace(/\s+/g, ' ').toLowerCase().slice(0, SEARCH_TERM_MAX);
  }

  /**
   * "cotton musl" -> "cotton:* & musl:*". Strips everything but letters and
   * digits so user input can never form tsquery syntax. Null when nothing
   * searchable is left.
   */
  toPrefixQuery(term: string): string | null {
    const words = term
      .split(' ')
      .map((w) => w.replace(/[^\p{L}\p{N}]/gu, ''))
      .filter(Boolean);
    return words.length ? words.map((w) => `${w}:*`).join(' & ') : null;
  }

  /** Matching product ids, best match first. */
  async matchIds(raw: string, { status, limit = MAX_MATCHES }: MatchOptions = {}): Promise<string[]> {
    const term = this.normalize(raw);
    if (term.length < SEARCH_TERM_MIN) return [];

    const tsQuery = this.toPrefixQuery(term);
    const tsq = tsQuery
      ? Prisma.sql`to_tsquery('english', search_unaccent(${tsQuery}))`
      : Prisma.sql`NULL::tsquery`;
    const statusFilter = status
      ? Prisma.sql`AND p."status" = ${status}::"ProductStatus"`
      : Prisma.empty;

    // set_config(..., true) is SET LOCAL: it lasts only for this transaction.
    const [, rows] = await this.prisma.$transaction([
      this.prisma.$queryRaw`SELECT set_config('pg_trgm.word_similarity_threshold', ${TYPO_THRESHOLD}, true)`,
      this.prisma.$queryRaw<Array<{ id: string }>>`
        SELECT p."id"
        FROM "Product" p
        WHERE p."archivedAt" IS NULL
          ${statusFilter}
          AND (${SEARCH_DOCUMENT} @@ ${tsq} OR search_unaccent(${term}) <% ${SEARCH_NAME})
        ORDER BY
          coalesce(ts_rank_cd(${SEARCH_DOCUMENT}, ${tsq}), 0)
            + word_similarity(search_unaccent(${term}), ${SEARCH_NAME}) DESC,
          p."createdAt" DESC
        LIMIT ${Math.min(limit, MAX_MATCHES)}
      `,
    ]);
    return rows.map((r) => r.id);
  }

  /**
   * Records a submitted storefront search. The result count is worked out
   * here rather than trusted from the client. Never throws: a failed log
   * must not break searching.
   */
  async record(raw: string): Promise<void> {
    const term = this.normalize(raw);
    if (term.length < SEARCH_TERM_MIN) return;
    try {
      const ids = await this.matchIds(term, { status: ProductStatus.PUBLISHED });
      await this.prisma.searchQuery.create({ data: { term, resultCount: ids.length } });
    } catch (err) {
      this.logger.warn(`Could not record search: ${(err as Error).message}`);
    }
  }
}
