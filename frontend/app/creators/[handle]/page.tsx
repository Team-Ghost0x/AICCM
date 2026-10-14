import React from "react";
import Link from "next/link";
import { fetchCreatorByHandle } from "@/lib/client/api";
import { allPlatformCreators } from "@/lib/contract/fixtures";
import { CreatorProfileView } from "@/components/creator-profile-view";
import { SearchIcon, HomeIcon, ArrowIcon } from "@/components/icons";

export function generateStaticParams() {
  const handles = allPlatformCreators.map((c) => ({ handle: c.handle }));
  const ids = allPlatformCreators.map((c) => ({ handle: c.id }));
  const aliases = [
    { handle: "creator-devin" },
    { handle: "creator-dev" },
    { handle: "creator-arjun" },
  ];
  return [...handles, ...ids, ...aliases];
}

interface PageProps {
  params: Promise<{ handle: string }>;
}

export default async function CreatorProfilePage({ params }: PageProps) {
  const { handle } = await params;
  const creator = await fetchCreatorByHandle(handle);

  if (!creator) {
    return (
      <div className="w-full min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 max-w-xl mx-auto text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-2xl mb-4 shadow-xs">
          🔍
        </div>
        <h1 className="text-2xl font-black text-[var(--text)] tracking-tight">
          Creator Not Found
        </h1>
        <p className="text-sm text-[var(--text-secondary-aa)] mt-2 leading-relaxed">
          We couldn&apos;t find a creator profile for{" "}
          <span className="font-mono font-bold text-[var(--link-aa)]">@{handle}</span>. The creator may have updated their handle or been archived.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          <Link
            href="/discover"
            className="px-5 py-2.5 bg-[var(--link-aa)] hover:bg-[var(--link-aa-hover)] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
          >
            <SearchIcon size={14} />
            <span>Browse All Creators</span>
          </Link>
          <Link
            href="/"
            className="px-5 py-2.5 bg-[var(--surface)] hover:bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] text-xs font-bold rounded-xl transition-colors flex items-center gap-2"
          >
            <HomeIcon size={14} />
            <span>Return to Home</span>
          </Link>
        </div>

        {/* Suggested creators */}
        <div className="w-full mt-10 pt-8 border-t border-[var(--border)] text-left">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary-aa)] block mb-3 font-mono">
            Verified AI Creators You May Like
          </span>
          <div className="flex flex-col gap-2.5">
            {allPlatformCreators.slice(0, 3).map((s) => (
              <Link
                key={s.id}
                href={`/creators/${s.handle}`}
                className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--link-aa)] transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--gradient-text-safe)] text-white font-bold flex items-center justify-center text-sm shrink-0">
                    {s.displayName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[var(--text)] group-hover:text-[var(--link-aa)] transition-colors">
                      {s.displayName}
                    </h3>
                    <p className="text-[11px] text-[var(--text-secondary-aa)] font-mono">
                      @{s.handle} · {s.specializations.slice(0, 2).join(", ")}
                    </p>
                  </div>
                </div>
                <ArrowIcon size={14} className="text-[var(--text-secondary-aa)] -rotate-90 group-hover:text-[var(--link-aa)]" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return <CreatorProfileView creator={creator} />;
}

