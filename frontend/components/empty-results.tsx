"use client";

import React from "react";
import { SearchRelaxation } from "@/lib/contract/schemas";

interface EmptyResultsProps {
  activeFilterCount: number;
  relaxations: SearchRelaxation[];
  onDropFilter: (filterKey: string, filterValue: string | number) => void;
  onClearAll: () => void;
}

export function EmptyResults({
  activeFilterCount,
  relaxations,
  onDropFilter,
  onClearAll,
}: EmptyResultsProps) {
  return (
    <div className="w-full bg-[#e5e5e5] p-8 md:p-12 text-left border border-[#000000]/15 flex flex-col gap-6">
      <div>
        <h3 className="text-2xl font-bold text-[#000000] tracking-tight">
          Nothing matches all {activeFilterCount} filters.
        </h3>
        <p className="text-sm text-[#3d3d3d] mt-1">
          Try relaxing one of your specific filter constraints to see matching creators.
        </p>
      </div>

      {/* Suggested relaxation exits */}
      {relaxations.length > 0 && (
        <div className="flex flex-col gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#3d3d3d]">
            Suggested Exits
          </span>
          <div className="flex flex-wrap gap-2.5">
            {relaxations.map(({ filter, value, wouldReturn }) => (
              <button
                key={`${filter}-${value}`}
                type="button"
                onClick={() => onDropFilter(filter, value)}
                className="inline-flex items-center gap-2 bg-[#ffffff] hover:bg-[#dedede] text-[#000000] border border-[#000000] px-3 py-2 text-xs font-medium rounded-[3px] transition-colors cursor-pointer"
              >
                <span>
                  Drop &ldquo;{String(value)}&rdquo; and {wouldReturn} creator
                  {wouldReturn > 1 ? "s" : ""} match
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Clear all action */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs bg-[#000000] text-[#ffffff] font-bold px-4 py-2.5 rounded-[3px] hover:bg-[#3d3d3d] transition-colors cursor-pointer"
        >
          Clear all filters
        </button>
      </div>
    </div>
  );
}
