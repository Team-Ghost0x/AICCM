import { Creator, SearchResponse, SearchRelaxation, SearchFacets } from "../contract/schemas";
import { goldenCreators } from "../contract/fixtures";

export interface SearchParams {
  q?: string;
  specialization?: string[];
  tool?: string[];
  skill?: string[];
  contentType?: string[];
  format?: string[];
  availability?: string;
  maxPriceInr?: number;
  verifiedToolsOnly?: boolean;
  sort?: "match" | "fastest" | "newest";
}

const CANONICAL_FILTER_ORDER = [
  "q",
  "specialization",
  "tool",
  "skill",
  "contentType",
  "format",
  "availability",
  "maxPriceInr",
  "verifiedToolsOnly",
];

// Helper to check if a single creator passes a filter set
function creatorMatchesFilters(
  creator: Creator,
  params: SearchParams,
  excludeKey?: keyof SearchParams
): boolean {
  // 1. Text Query (q)
  if (params.q && excludeKey !== "q") {
    const query = params.q.toLowerCase().trim();
    const matchName = creator.displayName.toLowerCase().includes(query);
    const matchBio = creator.bio.toLowerCase().includes(query);
    const matchHeadline = creator.headline.toLowerCase().includes(query);
    const matchTool = creator.tools.some((t) =>
      t.name.toLowerCase().includes(query) || t.toolId.toLowerCase().includes(query)
    );
    const matchSkill = creator.skills.some((s) => s.toLowerCase().includes(query));
    if (!matchName && !matchBio && !matchHeadline && !matchTool && !matchSkill) {
      return false;
    }
  }

  // 2. Specializations (OR within facet)
  if (
    params.specialization &&
    params.specialization.length > 0 &&
    excludeKey !== "specialization"
  ) {
    const hasSpec = params.specialization.some((s) =>
      creator.specializations.includes(s as Creator["specializations"][number])
    );
    if (!hasSpec) return false;
  }

  // 3. Tools (OR within facet)
  if (params.tool && params.tool.length > 0 && excludeKey !== "tool") {
    const hasTool = params.tool.some((reqTool) =>
      creator.tools.some(
        (t) =>
          t.toolId.toLowerCase() === reqTool.toLowerCase() ||
          t.name.toLowerCase() === reqTool.toLowerCase()
      )
    );
    if (!hasTool) return false;
  }

  // 4. Content Type (OR within facet)
  if (
    params.contentType &&
    params.contentType.length > 0 &&
    excludeKey !== "contentType"
  ) {
    const hasType = params.contentType.some((ct) =>
      creator.contentTypes.includes(ct as Creator["contentTypes"][number])
    );
    if (!hasType) return false;
  }

  // 5. Format / Aspect Ratio (OR within facet)
  if (params.format && params.format.length > 0 && excludeKey !== "format") {
    const hasFormat = params.format.some((f) =>
      creator.formats.includes(f as Creator["formats"][number])
    );
    if (!hasFormat) return false;
  }

  // 6. Availability
  if (params.availability && excludeKey !== "availability") {
    if (creator.availability !== params.availability) return false;
  }

  // 7. Max Price INR
  if (params.maxPriceInr !== undefined && excludeKey !== "maxPriceInr") {
    if (creator.priceFromInr > params.maxPriceInr) return false;
  }

  // 8. Verified Tools Only
  if (params.verifiedToolsOnly && excludeKey !== "verifiedToolsOnly") {
    const hasVerified = creator.tools.some(
      (t) => t.verify === "evidence_attached" || t.verify === "reviewed"
    );
    if (!hasVerified) return false;
  }

  return true;
}

export function executeSearch(
  creators: Creator[] = goldenCreators,
  params: SearchParams
): SearchResponse {
  // Matching creators
  let items = creators.filter((c) => creatorMatchesFilters(c, params));

  // Sort
  if (params.sort === "fastest") {
    items = [...items].sort((a, b) => a.turnaroundDays - b.turnaroundDays);
  } else if (params.sort === "newest") {
    items = [...items].sort((a, b) => b.priceFromInr - a.priceFromInr);
  }

  const total = items.length;

  // Facet counts (calculating counts per option ignoring that facet's own selection)
  const computeFacetCounts = (
    facetKey: keyof SearchParams,
    getValues: (c: Creator) => string[]
  ) => {
    const matchingExceptThisFacet = creators.filter((c) =>
      creatorMatchesFilters(c, params, facetKey)
    );

    const countsMap = new Map<string, number>();
    for (const c of matchingExceptThisFacet) {
      for (const val of getValues(c)) {
        countsMap.set(val, (countsMap.get(val) || 0) + 1);
      }
    }

    return Array.from(countsMap.entries()).map(([value, count]) => ({
      value,
      count,
    }));
  };

  const facets: SearchFacets = {
    specialization: computeFacetCounts("specialization", (c) => c.specializations),
    tool: computeFacetCounts("tool", (c) => c.tools.map((t) => t.toolId)),
    contentType: computeFacetCounts("contentType", (c) => c.contentTypes),
    format: computeFacetCounts("format", (c) => c.formats),
    availability: computeFacetCounts("availability", (c) => [c.availability]),
  };

  // Relaxations (when total is 0)
  const relaxations: SearchRelaxation[] = [];

  if (total === 0) {
    const activeFilters: { key: keyof SearchParams; value: string | number }[] = [];

    if (params.q) activeFilters.push({ key: "q", value: params.q });
    if (params.specialization?.length) {
      params.specialization.forEach((s) =>
        activeFilters.push({ key: "specialization", value: s })
      );
    }
    if (params.tool?.length) {
      params.tool.forEach((t) => activeFilters.push({ key: "tool", value: t }));
    }
    if (params.contentType?.length) {
      params.contentType.forEach((ct) =>
        activeFilters.push({ key: "contentType", value: ct })
      );
    }
    if (params.format?.length) {
      params.format.forEach((f) => activeFilters.push({ key: "format", value: f }));
    }
    if (params.availability) {
      activeFilters.push({ key: "availability", value: params.availability });
    }
    if (params.maxPriceInr !== undefined) {
      activeFilters.push({ key: "maxPriceInr", value: params.maxPriceInr });
    }
    if (params.verifiedToolsOnly) {
      activeFilters.push({ key: "verifiedToolsOnly", value: "true" });
    }

    for (const filter of activeFilters) {
      // Simulate dropping this specific filter value
      const remainingParams = { ...params };

      if (filter.key === "tool") {
        remainingParams.tool = params.tool?.filter((t) => t !== filter.value);
      } else if (filter.key === "format") {
        remainingParams.format = params.format?.filter((f) => f !== filter.value);
      } else if (filter.key === "specialization") {
        remainingParams.specialization = params.specialization?.filter(
          (s) => s !== filter.value
        );
      } else if (filter.key === "contentType") {
        remainingParams.contentType = params.contentType?.filter(
          (c) => c !== filter.value
        );
      } else {
        delete remainingParams[filter.key];
      }

      const matchCount = creators.filter((c) =>
        creatorMatchesFilters(c, remainingParams)
      ).length;

      // Hide entries that would still return 0
      if (matchCount > 0) {
        relaxations.push({
          filter: filter.key,
          value: filter.value,
          wouldReturn: matchCount,
        });
      }
    }

    // Sort relaxations: high to low, tiebreak in canonical filter order
    relaxations.sort((a, b) => {
      if (b.wouldReturn !== a.wouldReturn) {
        return b.wouldReturn - a.wouldReturn;
      }
      const orderA = CANONICAL_FILTER_ORDER.indexOf(a.filter);
      const orderB = CANONICAL_FILTER_ORDER.indexOf(b.filter);
      return orderA - orderB;
    });
  }

  return { items, total, facets, relaxations };
}
