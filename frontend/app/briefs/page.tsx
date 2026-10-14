"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Brief } from "@/lib/contract/schemas";
import { fetchAllBriefs } from "@/lib/client/api";
import { ArrowIcon, PlusIcon, SearchIcon, CheckIcon, OrdersIcon } from "@/components/icons";
import { getCurrentUser, onAuthChange, User } from "@/lib/client/auth";
import { AuthModal } from "@/components/auth-modal";

export default function BriefsDirectoryPage() {
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [filterQuery, setFilterQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [user, setUser] = useState<User | null>(() => getCurrentUser());
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    fetchAllBriefs().then(setBriefs);
    const unsub = onAuthChange((u) => setUser(u));
    return () => unsub();
  }, []);

  const filteredBriefs = briefs.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
      b.brandName.toLowerCase().includes(filterQuery.toLowerCase()) ||
      b.styleTags.some((tag) => tag.toLowerCase().includes(filterQuery.toLowerCase())) ||
      b.preferredTools.some((t) => t.toLowerCase().includes(filterQuery.toLowerCase()));

    const matchesType =
      selectedType === "all" || b.contentType.toLowerCase() === selectedType.toLowerCase();

    return matchesSearch && matchesType;
  });

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 text-left select-none flex flex-col gap-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--link-aa)] inline-block" />
            <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-secondary-aa)] font-bold">
              Creative Briefs &amp; Opportunities
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-[var(--text)] tracking-tight">
            Active Campaign Briefs
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary-aa)] mt-1">
            Browse commercial production opportunities, evaluate creative scope, and submit proposals with your verified AI workflows.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {user && (user.role === "brand" || user.role === "admin") ? (
            <Link
              href="/briefs/new"
              className="bg-[var(--link-aa)] hover:bg-[var(--link-aa-hover)] text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 select-none"
            >
              <PlusIcon size={16} />
              <span>Post a Brief</span>
            </Link>
          ) : user && user.role === "creator" ? (
            <span className="text-xs font-mono text-[var(--text-secondary-aa)] bg-[var(--surface)] border border-[var(--border)] px-3 py-2 rounded-lg">
              Creator Mode: Select brief below to pitch
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setShowAuthModal(true)}
              className="bg-[var(--link-aa)] hover:bg-[var(--link-aa-hover)] text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 select-none cursor-pointer"
            >
              <PlusIcon size={16} />
              <span>Sign in as Brand to Post</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-lg">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[var(--text-secondary-aa)]">
            <SearchIcon size={16} />
          </span>
          <input
            type="search"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Search by brand, title, style tag, or AI tool..."
            className="w-full pl-9 pr-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-xs sm:text-sm text-[var(--text)] placeholder-[var(--text-secondary-aa)] focus:outline-none focus:border-[var(--link-aa)] transition-colors min-h-[42px]"
          />
        </div>

        {/* Content Type Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
          {[
            { id: "all", label: "All Formats" },
            { id: "video", label: "AI Video" },
            { id: "still", label: "AI Still" },
            { id: "motion", label: "Motion Graphic" },
            { id: "series", label: "Campaign Series" },
          ].map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => setSelectedType(type.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap cursor-pointer ${
                selectedType === type.id
                  ? "bg-[var(--text)] text-[var(--surface)] shadow-xs"
                  : "bg-[var(--surface)] text-[var(--text-secondary-aa)] hover:text-[var(--text)] border border-[var(--border)]"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Briefs Count */}
      <div className="text-xs font-mono text-[var(--text-secondary-aa)] font-semibold">
        Showing {filteredBriefs.length} brief{filteredBriefs.length !== 1 ? "s" : ""} open for submission
      </div>

      {/* Briefs Grid */}
      {filteredBriefs.length === 0 ? (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-12 text-center flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary-aa)]">
            <OrdersIcon size={20} />
          </div>
          <h3 className="text-base font-bold text-[var(--text)]">No matching briefs found</h3>
          <p className="text-xs text-[var(--text-secondary-aa)] max-w-sm">
            Try adjusting your search query or format filter to discover more campaign opportunities.
          </p>
          <button
            type="button"
            onClick={() => {
              setFilterQuery("");
              setSelectedType("all");
            }}
            className="mt-2 text-xs font-bold text-[var(--link-aa)] hover:underline cursor-pointer"
          >
            Reset search filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredBriefs.map((brief) => (
            <div
              key={brief.id}
              className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] hover:border-[var(--link-aa)] transition-all duration-200 hover:-translate-y-0.5 shadow-xs flex flex-col justify-between gap-5 group"
            >
              <div className="flex flex-col gap-3">
                {/* Header Badges */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--link-aa)] bg-blue-50 dark:bg-blue-950/40 px-2.5 py-0.5 rounded-md border border-blue-200 dark:border-blue-900">
                    {brief.brandName}
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
                    {brief.budgetInr
                      ? `₹${brief.budgetInr.min.toLocaleString("en-IN")} – ₹${brief.budgetInr.max.toLocaleString("en-IN")}`
                      : "Budget open"}
                  </span>
                </div>

                <Link href={`/briefs/${brief.id}`} className="block group-hover:underline">
                  <h2 className="text-xl font-bold text-[var(--text)] tracking-tight leading-snug">
                    {brief.title}
                  </h2>
                </Link>

                <p className="text-xs text-[var(--text-secondary-aa)] leading-relaxed line-clamp-2">
                  {brief.objective}
                </p>

                {/* Creative Scope Box */}
                <div className="bg-[var(--bg)] p-3 rounded-xl border border-[var(--border)] text-xs text-[var(--text)] flex flex-col gap-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-[var(--text-secondary-aa)] tracking-wider">
                    Scope &amp; Format Specifications
                  </span>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold">
                      {brief.deliverablesCount}x {brief.contentType} asset{brief.deliverablesCount !== 1 ? "s" : ""}
                    </span>
                    <span className="text-[var(--border)]">·</span>
                    <span className="text-[var(--text-secondary-aa)]">
                      Ratios: {brief.formats.map((f) => f.aspectRatio).join(", ")}
                    </span>
                  </div>
                </div>

                {/* Tags & Tools */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {brief.styleTags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-mono bg-[var(--bg)] px-2 py-0.5 rounded border border-[var(--border)] text-[var(--text-secondary-aa)]"
                    >
                      #{tag}
                    </span>
                  ))}
                  {brief.preferredTools.map((t) => (
                    <span
                      key={t}
                      className="text-[10px] font-mono font-semibold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-900 uppercase"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Strip */}
              <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
                <span className="text-[11px] font-mono text-[var(--text-secondary-aa)]">
                  Deadline: {brief.deadline ? new Date(brief.deadline).toLocaleDateString("en-IN") : "Rolling"}
                </span>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/briefs/${brief.id}`}
                    className="bg-[var(--link-aa)] hover:bg-[var(--link-aa-hover)] text-white font-bold text-xs px-4 py-2 rounded-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    <span>View &amp; Apply</span>
                    <ArrowIcon size={12} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          defaultRole="brand"
        />
      )}
    </div>
  );
}
