"use client";

import React, { useState } from "react";
import Link from "next/link";
import { playClickSound } from "@/lib/client/audio";
import { CommunicationModal } from "./communication-modal";
import { Creator } from "@/lib/contract/schemas";
import { allPlatformCreators } from "@/lib/contract/fixtures";
import { getCurrentUser, switchRole } from "@/lib/client/auth";

export function OpenForWorkRail({ className = "" }: { className?: string }) {
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Specific creators matching Figma board (Arjun Verma, Sofia Marques, Dev Rao)
  const openCreators = [
    {
      ...allPlatformCreators[0],
      displayName: "Arjun Verma",
      headline: "Social shorts, 2 day turnaround",
      ring: "ring-gradient-amber",
    },
    {
      ...allPlatformCreators[2],
      displayName: "Sofia Marques",
      headline: "AI animation, mascots",
      ring: "ring-gradient-purple",
    },
    {
      ...allPlatformCreators[3],
      displayName: "Dev Rao",
      headline: "Fashion lookbooks, music video",
      ring: "ring-gradient-pink",
    },
  ];

  const handleInvite = (creator: Creator) => {
    playClickSound();
    setSelectedCreator(creator);
    setIsModalOpen(true);
  };

  return (
    <>
      <aside className={`flex flex-col gap-5 select-none ${className}`}>
        {/* Top Production Hub Card */}
        <div className="bg-[var(--panel)] border border-[var(--border-color)] rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-xs font-bold text-[var(--ink)]">
              Brand &amp; Creator Dashboard
            </div>
            <div className="text-[11px] text-[var(--muted)]">
              Manage briefs, takes &amp; escrow
            </div>
          </div>
          <Link
            href="/dashboard"
            className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-full shadow-xs transition-all active:scale-95 inline-flex items-center gap-1"
          >
            <span>Open</span>
          </Link>
        </div>

        {/* Open for work this week Panel */}
        <div className="bg-[var(--panel)] border border-[var(--border-color)] rounded-2xl p-5 flex flex-col gap-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
            <h2 className="text-sm font-bold text-[var(--ink)] tracking-tight">
              Open for work this week
            </h2>
            <Link
              href="/discover"
              className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:underline"
            >
              See all
            </Link>
          </div>

          <div className="flex flex-col gap-3.5">
            {openCreators.map((creator) => (
              <div
                key={creator.id}
                className="flex items-center justify-between gap-3 group"
              >
                <Link
                  href={`/creators/${creator.handle}`}
                  className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-90"
                >
                  <div
                    className={`w-10 h-10 rounded-full p-[2px] ${creator.ring} flex-shrink-0`}
                  >
                    <div className="w-full h-full rounded-full bg-[var(--surround)] flex items-center justify-center font-bold text-xs text-[var(--ink)]">
                      {creator.displayName.charAt(0)}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-[var(--ink)] group-hover:text-purple-600 transition-colors truncate">
                      {creator.displayName}
                    </div>
                    <div className="text-[11px] text-[var(--muted)] truncate">
                      {creator.headline}
                    </div>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={() => handleInvite(creator)}
                  className="flex-shrink-0 px-3 py-1 text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 hover:bg-[#7c3aed] hover:text-white rounded-full border border-purple-200 dark:border-purple-800 transition-all cursor-pointer active:scale-95"
                >
                  Invite
                </button>
              </div>
            ))}
          </div>

          {/* Sample disclaimer note from PDF Page 6 */}
          <div className="pt-3 border-t border-[var(--border-color)] text-[10px] text-[var(--muted)] leading-relaxed">
            Sample profiles and sample work, made for the demo. Verification here means proof is attached, not an audit.
          </div>
        </div>
      </aside>

      {selectedCreator && (
        <CommunicationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          targetCreator={selectedCreator}
        />
      )}
    </>
  );
}
