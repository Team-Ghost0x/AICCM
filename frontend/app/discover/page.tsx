"use client";

import React, { useEffect, useState, useTransition, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchCreators } from "@/lib/client/api";
import { Creator, SearchFacets, SearchRelaxation } from "@/lib/contract/schemas";
import { SearchParams } from "@/lib/mocks/search";
import { FilterRail } from "@/components/filter-rail";
import { GigCard, GigCardSkeleton } from "@/components/gig-card";
import { EmptyResults } from "@/components/empty-results";
import { CategoryStrip } from "@/components/category-strip";
import { CloseIcon, SearchIcon } from "@/components/icons";
import { CommunicationModal } from "@/components/communication-modal";
import { TakeViewerModal } from "@/components/take-viewer-modal";
import { getCurrentUser, User, onAuthChange } from "@/lib/client/auth";
import { AuthModal } from "@/components/auth-modal";

function DiscoverContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // Parse filters from URL
  const [filters, setFilters] = useState<SearchParams>(() => {
    const q = searchParams?.get("q") || undefined;
    const tools = searchParams?.getAll("tool") || [];
    const specs = searchParams?.getAll("specialization") || [];
    const contentTypes = searchParams?.getAll("contentType") || [];
    const formats = searchParams?.getAll("format") || [];
    const availability = searchParams?.get("availability") || undefined;
    const maxPrice = searchParams?.get("maxPriceInr")
      ? Number(searchParams.get("maxPriceInr"))
      : undefined;
    const verified = searchParams?.get("verifiedToolsOnly") === "true";
    const sort = (searchParams?.get("sort") as SearchParams["sort"]) || "match";

    return {
      q,
      tool: tools.length > 0 ? tools : undefined,
      specialization: specs.length > 0 ? specs : undefined,
      contentType: contentTypes.length > 0 ? contentTypes : undefined,
      format: formats.length > 0 ? formats : undefined,
      availability,
      maxPriceInr: maxPrice,
      verifiedToolsOnly: verified || undefined,
      sort,
    };
  });

  const [creators, setCreators] = useState<Creator[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [facets, setFacets] = useState<SearchFacets>({
    specialization: [],
    tool: [],
    contentType: [],
    format: [],
    availability: [],
  });
  const [relaxations, setRelaxations] = useState<SearchRelaxation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCreatorForHire, setSelectedCreatorForHire] = useState<Creator | null>(null);
  const [isHireModalOpen, setIsHireModalOpen] = useState(false);
  const [lightboxTake, setLightboxTake] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(() => getCurrentUser());
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const unsub = onAuthChange((u) => setCurrentUser(u));
    return () => unsub();
  }, []);

  // Sync filters to URL and execute search
  const syncFiltersToUrl = (newFilters: SearchParams) => {
    setIsLoading(true);
    setFilters(newFilters);
    const params = new URLSearchParams();

    if (newFilters.q) params.set("q", newFilters.q);
    if (newFilters.tool?.length) {
      newFilters.tool.forEach((t) => params.append("tool", t));
    }
    if (newFilters.specialization?.length) {
      newFilters.specialization.forEach((s) => params.append("specialization", s));
    }
    if (newFilters.contentType?.length) {
      newFilters.contentType.forEach((ct) => params.append("contentType", ct));
    }
    if (newFilters.format?.length) {
      newFilters.format.forEach((f) => params.append("format", f));
    }
    if (newFilters.availability) params.set("availability", newFilters.availability);
    if (newFilters.maxPriceInr) params.set("maxPriceInr", String(newFilters.maxPriceInr));
    if (newFilters.verifiedToolsOnly) params.set("verifiedToolsOnly", "true");
    if (newFilters.sort && newFilters.sort !== "match") params.set("sort", newFilters.sort);

    startTransition(() => {
      router.push(`/discover?${params.toString()}`);
    });
  };

  useEffect(() => {
    let isCurrent = true;

    fetchCreators(filters)
      .then((res) => {
        if (!isCurrent) return;
        setCreators(res.items);
        setTotalCount(res.total);
        setFacets(res.facets);
        setRelaxations(res.relaxations);
        setIsLoading(false);
      })
      .catch(() => {
        if (!isCurrent) return;
        setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [filters]);

  // Compute active tokens
  const activeTokens: { key: string; value: string; label: string }[] = [];
  if (filters.q) activeTokens.push({ key: "q", value: filters.q, label: `"${filters.q}"` });
  filters.tool?.forEach((t) => activeTokens.push({ key: "tool", value: t, label: `Tool: ${t}` }));
  filters.format?.forEach((f) => activeTokens.push({ key: "format", value: f, label: `Ratio: ${f}` }));
  filters.contentType?.forEach((ct) => activeTokens.push({ key: "contentType", value: ct, label: `Type: ${ct}` }));
  filters.specialization?.forEach((s) => activeTokens.push({ key: "specialization", value: s, label: `Spec: ${s}` }));
  if (filters.availability) activeTokens.push({ key: "availability", value: filters.availability, label: filters.availability });
  if (filters.maxPriceInr) activeTokens.push({ key: "maxPriceInr", value: String(filters.maxPriceInr), label: `≤ ₹${filters.maxPriceInr.toLocaleString("en-IN")}` });
  if (filters.verifiedToolsOnly) activeTokens.push({ key: "verifiedToolsOnly", value: "true", label: "Verified only" });

  const handleDropToken = (key: string, value: string) => {
    const updated = { ...filters };
    if (key === "tool") updated.tool = filters.tool?.filter((t) => t !== value);
    else if (key === "format") updated.format = filters.format?.filter((f) => f !== value);
    else if (key === "specialization") updated.specialization = filters.specialization?.filter((s) => s !== value);
    else if (key === "contentType") updated.contentType = filters.contentType?.filter((c) => c !== value);
    else if (key === "q") delete updated.q;
    else if (key === "availability") delete updated.availability;
    else if (key === "maxPriceInr") delete updated.maxPriceInr;
    else if (key === "verifiedToolsOnly") delete updated.verifiedToolsOnly;

    syncFiltersToUrl(updated);
  };

  const handleClearAll = () => {
    syncFiltersToUrl({ sort: filters.sort });
  };

  const handleHireCreator = (creator: Creator) => {
    setSelectedCreatorForHire(creator);
    setIsHireModalOpen(true);
  };

  // Only brands are authorized to access and view creator discovery
  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center select-none">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 shadow-xl flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 mb-4">
            <SearchIcon size={28} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--text)] mb-2">
            Brand Authentication Required
          </h1>
          <p className="text-xs text-[var(--text-secondary-aa)] mb-6 max-w-md">
            Discovering and evaluating generative AI creators is reserved for Brand and Creative Agency accounts. Sign in as a brand to explore portfolios, inspect iteration takes, and commission projects.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-6 py-2.5 rounded-full bg-[var(--link-aa)] hover:bg-[var(--link-aa-hover)] text-white font-bold text-xs transition-colors shadow-sm cursor-pointer"
            >
              Sign In as Brand
            </button>
            <Link
              href="/"
              className="px-6 py-2.5 rounded-full bg-[var(--surface-sunken)] hover:bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text)] font-bold text-xs transition-colors text-center"
            >
              Return to Home
            </Link>
          </div>
        </div>
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

  if (currentUser.role !== "brand") {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center select-none">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 shadow-xl flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 mb-4">
            <SearchIcon size={28} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--text)] mb-2">
            Brand &amp; Agency Feature
          </h1>
          <p className="text-xs text-[var(--text-secondary-aa)] mb-6 max-w-md">
            You are currently signed in as a <strong className="capitalize text-[var(--text)]">{currentUser.role}</strong>. Creator Discovery is reserved for Brands and Creative Agencies seeking to commission projects.
            {currentUser.role === "creator" ? " As an AI creator, explore Open Briefs to pitch brand directors and win production jobs." : ""}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
            <Link
              href={currentUser.role === "creator" ? "/briefs" : "/admin"}
              className="px-6 py-2.5 rounded-full bg-[var(--link-aa)] hover:bg-[var(--link-aa-hover)] text-white font-bold text-xs transition-colors shadow-sm text-center"
            >
              {currentUser.role === "creator" ? "Browse Open Briefs" : "Admin Console"}
            </Link>
            <Link
              href="/dashboard"
              className="px-6 py-2.5 rounded-full bg-[var(--surface-sunken)] hover:bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text)] font-bold text-xs transition-colors text-center"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full text-left">
      {/* 1. Category Strip across top of browse */}
      <CategoryStrip
        activeCategory={filters.specialization?.[0] || "all"}
        onSelectCategory={(catId) => {
          syncFiltersToUrl({
            ...filters,
            specialization: catId === "all" ? undefined : [catId],
          });
        }}
      />

      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 md:px-10 py-6">
        {/* 2. Top Search Bar & Sort Row */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-xl">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[var(--text-secondary)]">
              <SearchIcon size={18} />
            </span>
            <input
              type="search"
              defaultValue={filters.q || ""}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  syncFiltersToUrl({
                    ...filters,
                    q: (e.target as HTMLInputElement).value.trim() || undefined,
                  });
                }
              }}
              placeholder="Search tools, styles, creators..."
              className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface)] border border-[var(--control-border)] rounded-lg text-sm text-[var(--text)] placeholder-[var(--text-secondary-aa)] focus-visible:outline-2 focus-visible:outline-[var(--link)] transition-all min-h-[44px]"
            />
          </div>

          <div className="flex items-center gap-4 text-xs self-end md:self-center">
            <span className="text-xs font-bold tabular-numbers text-[var(--text)]">
              {totalCount} creator{totalCount !== 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-2">
              <label htmlFor="sort-select" className="text-[var(--text-secondary-aa)]">
                Sort:
              </label>
              <select
                id="sort-select"
                value={filters.sort || "match"}
                onChange={(e) =>
                  syncFiltersToUrl({
                    ...filters,
                    sort: e.target.value as SearchParams["sort"],
                  })
                }
                className="bg-[var(--surface)] border border-[var(--border)] px-3 py-1.5 rounded-lg font-medium text-[var(--text)] focus-visible:outline-2 focus-visible:outline-[var(--link)] cursor-pointer min-h-[36px]"
              >
                <option value="match">Best match</option>
                <option value="fastest">Fastest delivery</option>
                <option value="newest">Rate: High to low</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. Main 12-col Layout: Filter Rail (3 cols) + Gig Grid (9 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Docked Left Filter Rail */}
          <div className="lg:col-span-3 lg:sticky lg:top-4">
            <FilterRail
              filters={filters}
              facets={facets}
              onFilterChange={syncFiltersToUrl}
              onClearAll={handleClearAll}
            />
          </div>

          {/* Results Area */}
          <div className="lg:col-span-9 flex flex-col gap-5">
            {/* Filter Relaxation Banner (if present) */}
            {relaxations.length > 0 && totalCount === 0 && (
              <div className="p-4 rounded-lg bg-[var(--surface)] border border-[var(--accent)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="text-xs font-semibold text-[var(--text)]">
                  Drop &ldquo;{relaxations[0].value}&rdquo; and {relaxations[0].wouldReturn} creators match.
                </div>
                <button
                  type="button"
                  onClick={() => handleDropToken(relaxations[0].filter, String(relaxations[0].value))}
                  className="px-3.5 py-1.5 bg-[var(--text)] text-[var(--surface)] text-xs font-bold rounded-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer shadow-xs min-h-[36px]"
                >
                  Drop {relaxations[0].value}
                </button>
              </div>
            )}

            {/* Active Filter Chips */}
            {activeTokens.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 p-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
                <span className="text-xs font-semibold text-[var(--text-secondary-aa)] mr-1">
                  Active:
                </span>
                {activeTokens.map(({ key, value, label }) => (
                  <button
                    key={`${key}-${value}`}
                    type="button"
                    onClick={() => handleDropToken(key, value)}
                    className="inline-flex items-center gap-1.5 bg-[var(--bg)] hover:bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] px-2.5 py-1 text-xs rounded-full transition-colors cursor-pointer min-h-[28px]"
                  >
                    <span>{label}</span>
                    <CloseIcon size={12} />
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-xs font-bold underline text-[var(--link-aa)] hover:text-[var(--link-aa-hover)] ml-2 cursor-pointer"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* Gig Card Grid (3 or 4 columns on large screens) */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <GigCardSkeleton key={i} />
                ))}
              </div>
            ) : totalCount === 0 ? (
              <EmptyResults
                activeFilterCount={activeTokens.length}
                relaxations={relaxations}
                onDropFilter={(key, value) => handleDropToken(key, String(value))}
                onClearAll={handleClearAll}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {creators.map((creator) => (
                  <GigCard
                    key={creator.id}
                    creator={creator}
                    onHire={handleHireCreator}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hire / Brief Modal */}
      {selectedCreatorForHire && (
        <CommunicationModal
          isOpen={isHireModalOpen}
          onClose={() => {
            setIsHireModalOpen(false);
            setSelectedCreatorForHire(null);
          }}
          targetCreator={selectedCreatorForHire}
          onSuccess={() => {
            setIsHireModalOpen(false);
            setSelectedCreatorForHire(null);
            router.push("/messages");
          }}
        />
      )}

      {/* Lightbox Take Viewer Modal */}
      {lightboxTake !== null && (
        <TakeViewerModal
          isOpen={true}
          onClose={() => setLightboxTake(null)}
          initialTake={lightboxTake}
          totalTakes={23}
        />
      )}
    </div>
  );
}

export default function DiscoverPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-sm text-[var(--text-secondary-aa)]">
          Loading discovery engine...
        </div>
      }
    >
      <DiscoverContent />
    </Suspense>
  );
}
