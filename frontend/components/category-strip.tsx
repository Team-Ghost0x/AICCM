"use client";

import React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Specialization } from "@/lib/contract/schemas";

export interface CategoryItem {
  id: Specialization | "all";
  label: string;
}

export const CATEGORIES: CategoryItem[] = [
  { id: "all", label: "All Categories" },
  { id: "ai_film", label: "AI Film" },
  { id: "ai_animation", label: "AI Animation" },
  { id: "product_ads", label: "Product Ads" },
  { id: "motion_graphics", label: "Motion Graphics" },
  { id: "fashion_lookbook", label: "Fashion Lookbooks" },
  { id: "music_video", label: "Music Video" },
  { id: "social_shorts", label: "Social Shorts" },
  { id: "brand_mascots", label: "Brand Mascots" },
];

interface CategoryStripProps {
  activeCategory?: string;
  onSelectCategory?: (category: string) => void;
  className?: string;
}

export function CategoryStrip({
  activeCategory: controlledCategory,
  onSelectCategory,
  className = "",
}: CategoryStripProps) {
  const searchParams = useSearchParams();
  const urlCategory = searchParams?.get("specialization") || "all";
  const activeId = controlledCategory !== undefined ? controlledCategory : urlCategory;

  return (
    <nav
      aria-label="Service Categories"
      className={`w-full overflow-x-auto scrollbar-none border-b border-[var(--border)] bg-[var(--surface)] ${className}`}
    >
      <div className="flex items-center gap-1 sm:gap-2 px-4 py-2 min-w-max">
        {CATEGORIES.map((cat) => {
          const isActive = activeId === cat.id;
          const href = cat.id === "all" ? "/discover" : `/discover?specialization=${cat.id}`;

          if (onSelectCategory) {
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className={`relative px-3.5 py-2 text-xs sm:text-sm transition-colors cursor-pointer select-none whitespace-nowrap min-h-[44px] flex items-center ${
                  isActive
                    ? "text-[var(--text)] font-bold"
                    : "text-[var(--text-secondary-aa)] hover:text-[var(--text)] font-medium"
                }`}
              >
                <span>{cat.label}</span>
                {isActive && (
                  <span
                    className="absolute bottom-0 inset-x-2 h-[2px] rounded-full"
                    style={{ background: "var(--gradient-primary)" }}
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          }

          return (
            <Link
              key={cat.id}
              href={href}
              className={`relative px-3.5 py-2 text-xs sm:text-sm transition-colors cursor-pointer select-none whitespace-nowrap min-h-[44px] flex items-center ${
                isActive
                  ? "text-[var(--text)] font-bold"
                  : "text-[var(--text-secondary-aa)] hover:text-[var(--text)] font-medium"
              }`}
            >
              <span>{cat.label}</span>
              {isActive && (
                <span
                  className="absolute bottom-0 inset-x-2 h-[2px] rounded-full"
                  style={{ background: "var(--gradient-primary)" }}
                  aria-hidden="true"
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
