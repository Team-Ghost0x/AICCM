"use client";

import React from "react";
import { AspectRatio } from "@/lib/contract/schemas";
import { CheckIcon } from "./icons";

interface AspectRatioPickerProps {
  selected: AspectRatio[];
  onChange: (ratios: AspectRatio[]) => void;
}

interface RatioItem {
  ratio: AspectRatio;
  label: string;
  width: number;
  height: number;
}

const RATIOS: RatioItem[] = [
  { ratio: "9:16", label: "9:16", width: 25, height: 44 },
  { ratio: "4:5", label: "4:5", width: 35, height: 44 },
  { ratio: "1:1", label: "1:1", width: 40, height: 40 },
  { ratio: "16:9", label: "16:9", width: 50, height: 28 },
  { ratio: "21:9", label: "21:9", width: 58, height: 25 },
];

export function AspectRatioPicker({ selected, onChange }: AspectRatioPickerProps) {
  const toggleRatio = (ratio: AspectRatio) => {
    if (selected.includes(ratio)) {
      onChange(selected.filter((r) => r !== ratio));
    } else {
      onChange([...selected, ratio]);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-[#3d3d3d]">
        Aspect Ratios (select all required)
      </span>
      <div className="flex items-end gap-4 py-2 overflow-x-auto" role="group">
        {RATIOS.map(({ ratio, label, width, height }) => {
          const isSelected = selected.includes(ratio);
          return (
            <button
              key={ratio}
              type="button"
              aria-pressed={isSelected}
              onClick={() => toggleRatio(ratio)}
              className="flex flex-col items-center gap-1.5 focus:outline-none group cursor-pointer transition-transform duration-150 hover:-translate-y-1 active:translate-y-0.5 active:scale-95"
            >
              <div
                style={{ width: `${width}px`, height: `${height}px` }}
                className={`border-2 border-[#000000] rounded-none transition-all duration-150 group-hover:scale-105 flex items-center justify-center ${
                  isSelected ? "bg-[#000000]" : "bg-[#ffffff] group-hover:bg-[#e5e5e5]"
                }`}
              >
                {isSelected && (
                  <span className="text-[#ffffff] animate-pulse">
                    <CheckIcon size={12} strokeWidth={2.5} />
                  </span>
                )}
              </div>
              <span
                className={`text-xs tabular-numbers font-medium ${
                  isSelected ? "text-[#000000] font-bold" : "text-[#3d3d3d]"
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
