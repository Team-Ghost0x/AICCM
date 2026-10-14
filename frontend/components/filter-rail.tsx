"use client";

import React from "react";
import { SearchFacets } from "@/lib/contract/schemas";
import { SearchParams } from "@/lib/mocks/search";

interface FilterRailProps {
  filters: SearchParams;
  facets: SearchFacets;
  onFilterChange: (newFilters: SearchParams) => void;
  onClearAll: () => void;
}

const ALL_TOOLS = ["runway", "kling", "midjourney", "comfyui", "magnific"];
const ALL_SPECIALIZATIONS = [
  { id: "product_ads", label: "Product Ads" },
  { id: "ai_film", label: "AI Film" },
  { id: "social_shorts", label: "Social Shorts" },
  { id: "motion_graphics", label: "Motion Graphics" },
  { id: "ai_animation", label: "AI Animation" },
  { id: "brand_mascots", label: "Brand Mascots" },
  { id: "fashion_lookbook", label: "Fashion Lookbook" },
  { id: "music_video", label: "Music Video" },
];
const ALL_CONTENT_TYPES = ["video", "animation", "still"];
const ALL_FORMATS = ["9:16", "4:5", "1:1", "16:9", "21:9"];

export function FilterRail({
  filters,
  facets,
  onFilterChange,
  onClearAll,
}: FilterRailProps) {
  const [localQuery, setLocalQuery] = React.useState(filters.q || "");
  const [prevFiltersQ, setPrevFiltersQ] = React.useState(filters.q);

  if (filters.q !== prevFiltersQ) {
    setPrevFiltersQ(filters.q);
    setLocalQuery(filters.q || "");
  }

  React.useEffect(() => {
    const trimmed = localQuery.trim();
    const currentQ = filters.q || "";
    if (trimmed === currentQ) return;

    const timer = setTimeout(() => {
      onFilterChange({ ...filters, q: trimmed || undefined });
    }, 250);

    return () => clearTimeout(timer);
  }, [localQuery, filters, onFilterChange]);

  const getFacetCount = (facetList: { value: string; count: number }[], val: string) => {
    const item = facetList.find((f) => f.value.toLowerCase() === val.toLowerCase());
    return item ? item.count : 0;
  };

  const toggleArrayItem = (key: "tool" | "specialization" | "contentType" | "format", val: string) => {
    const current = filters[key] || [];
    const exists = current.includes(val);
    const updated = exists ? current.filter((x) => x !== val) : [...current, val];
    onFilterChange({
      ...filters,
      [key]: updated.length > 0 ? updated : undefined,
    });
  };

  return (
    <aside
      aria-label="Search and Filter Creators"
      className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4 sm:p-5 flex flex-col gap-5 text-left select-none shadow-xs"
    >
      {/* Header with Title and Clear Action */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
        <h2 className="text-sm font-bold text-[var(--text)] uppercase tracking-wider font-mono">
          Filters
        </h2>
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs font-semibold text-[var(--link-aa)] hover:underline cursor-pointer"
        >
          Reset
        </button>
      </div>

      {/* Freeform Search Bar */}
      <div>
        <label
          htmlFor="filter-search-input"
          className="block text-xs font-semibold text-[var(--text-secondary-aa)] mb-1.5"
        >
          Keyword Search
        </label>
        <input
          id="filter-search-input"
          type="text"
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          placeholder="e.g. runway, luxury, 3D"
          className="w-full bg-[var(--bg)] border border-[var(--control-border)] focus:border-[var(--link)] rounded-lg px-3 py-2 text-xs text-[var(--text)] placeholder-[var(--text-secondary-aa)] focus-visible:outline-2 focus-visible:outline-[var(--link)] transition-all"
        />
      </div>

      {/* AI Tools with live facet counts */}
      <div>
        <span className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary-aa)] mb-2">
          AI Tools
        </span>
        <div className="flex flex-col gap-1.5">
          {ALL_TOOLS.map((tool) => {
            const count = getFacetCount(facets.tool, tool);
            const isChecked = filters.tool?.includes(tool) || false;
            return (
              <label
                key={tool}
                className="flex items-center justify-between text-xs text-[var(--text)] hover:bg-[var(--bg)] p-1.5 transition-colors rounded cursor-pointer select-none"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleArrayItem("tool", tool)}
                    className="w-4 h-4 rounded border-[var(--control-border)] accent-[var(--link-aa)]"
                  />
                  <span className="capitalize">{tool}</span>
                </div>
                <span className="text-[var(--text-secondary-aa)] tabular-numbers text-[11px]">
                  ({count})
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Formats / Aspect Ratios */}
      <div>
        <span className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary-aa)] mb-2">
          Aspect Ratios
        </span>
        <div className="flex flex-col gap-1.5">
          {ALL_FORMATS.map((fmt) => {
            const count = getFacetCount(facets.format, fmt);
            const isChecked = filters.format?.includes(fmt) || false;
            return (
              <label
                key={fmt}
                className="flex items-center justify-between text-xs text-[var(--text)] hover:bg-[var(--bg)] p-1.5 transition-colors rounded cursor-pointer select-none"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleArrayItem("format", fmt)}
                    className="w-4 h-4 rounded border-[var(--control-border)] accent-[var(--link-aa)]"
                  />
                  <span>{fmt}</span>
                </div>
                <span className="text-[var(--text-secondary-aa)] tabular-numbers text-[11px]">
                  ({count})
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Content Type */}
      <div>
        <span className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary-aa)] mb-2">
          Content Type
        </span>
        <div className="flex flex-col gap-1.5">
          {ALL_CONTENT_TYPES.map((ct) => {
            const count = getFacetCount(facets.contentType, ct);
            const isChecked = filters.contentType?.includes(ct) || false;
            return (
              <label
                key={ct}
                className="flex items-center justify-between text-xs text-[var(--text)] hover:bg-[var(--bg)] p-1.5 transition-colors rounded cursor-pointer select-none"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleArrayItem("contentType", ct)}
                    className="w-4 h-4 rounded border-[var(--control-border)] accent-[var(--link-aa)]"
                  />
                  <span className="capitalize">{ct}</span>
                </div>
                <span className="text-[var(--text-secondary-aa)] tabular-numbers text-[11px]">
                  ({count})
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Specializations */}
      <div>
        <span className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary-aa)] mb-2">
          Specialization
        </span>
        <div className="flex flex-col gap-1.5">
          {ALL_SPECIALIZATIONS.map(({ id, label }) => {
            const isChecked = filters.specialization?.includes(id) || false;
            return (
              <label
                key={id}
                className="flex items-center gap-2 text-xs text-[var(--text)] hover:bg-[var(--bg)] p-1.5 transition-colors rounded cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleArrayItem("specialization", id)}
                  className="w-4 h-4 rounded border-[var(--control-border)] accent-[var(--link-aa)]"
                />
                <span>{label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Max Price INR */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label
            htmlFor="filter-max-price"
            className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary-aa)]"
          >
            Max Price
          </label>
          <span className="text-xs font-bold font-mono text-[var(--text)]">
            {filters.maxPriceInr
              ? `₹${Number(filters.maxPriceInr).toLocaleString("en-IN")}`
              : "Any price"}
          </span>
        </div>
        <input
          id="filter-max-price"
          type="range"
          min="10000"
          max="150000"
          step="5000"
          value={filters.maxPriceInr || 150000}
          onChange={(e) => {
            const val = Number(e.target.value);
            onFilterChange({
              ...filters,
              maxPriceInr: val < 150000 ? val : undefined,
            });
          }}
          className="w-full h-1.5 bg-[var(--border)] rounded-lg appearance-none cursor-pointer accent-[var(--link-aa)]"
        />
        <div className="flex justify-between text-[10px] text-[var(--text-secondary-aa)] font-mono mt-1">
          <span>₹10,000</span>
          <span>₹150,000+</span>
        </div>
      </div>

      {/* Availability */}
      <div>
        <span className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary-aa)] mb-2">
          Availability
        </span>
        <div className="flex flex-col gap-1.5">
          {[
            { id: "open", label: "Open for work" },
            { id: "any", label: "Any status" },
          ].map((opt) => (
            <label
              key={opt.id}
              className="flex items-center gap-2 text-xs text-[var(--text)] hover:bg-[var(--bg)] p-1.5 transition-colors rounded cursor-pointer select-none"
            >
              <input
                type="radio"
                name="availability"
                checked={
                  opt.id === "any"
                    ? !filters.availability
                    : filters.availability === opt.id
                }
                onChange={() => {
                  onFilterChange({
                    ...filters,
                    availability: opt.id === "any" ? undefined : (opt.id as SearchParams["availability"]),
                  });
                }}
                className="w-4 h-4 border-[var(--control-border)] accent-[var(--link-aa)]"
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Verified Tools Only Toggle */}
      <div className="pt-2 border-t border-[var(--border)]">
        <label className="flex items-center gap-2.5 text-xs text-[var(--text)] font-semibold cursor-pointer select-none">
          <input
            type="checkbox"
            checked={Boolean(filters.verifiedToolsOnly)}
            onChange={(e) => {
              onFilterChange({
                ...filters,
                verifiedToolsOnly: e.target.checked || undefined,
              });
            }}
            className="w-4 h-4 rounded border-[var(--control-border)] accent-[var(--link-aa)]"
          />
          <span>Verified tools only</span>
        </label>
      </div>
    </aside>
  );
}
