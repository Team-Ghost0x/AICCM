"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Creator, PortfolioPiece } from "@/lib/contract/schemas";
import { CheckIcon, ArrowIcon, HeartIcon, ShareIcon } from "./icons";
import { ScreeningRoom } from "./screening-room";
import { MediaFrame } from "./media-frame";
import { CreatorActions } from "./creator-actions";
import { NodePipelineGraph } from "./node-pipeline-graph";
import { playClickSound } from "@/lib/client/audio";

interface CreatorProfileViewProps {
  creator: Creator;
}

export function CreatorProfileView({ creator }: CreatorProfileViewProps) {
  const [activeTab, setActiveTab] = useState<"portfolio" | "screening" | "process" | "tools">("portfolio");
  const [selectedPiece, setSelectedPiece] = useState<PortfolioPiece>(creator.portfolio[0]);

  const primaryPiece = creator.portfolio[0];
  const availabilityText = {
    open: "Open for work",
    limited: "Limited availability",
    booked: "Booked",
  }[creator.availability];

  const totalTakes = creator.portfolio.reduce((acc, p) => acc + (p.takesCount || 10), 0);
  const startingPrice = creator.priceFromInr || 25000;
  const turnaroundDays = creator.turnaroundDays || 4;

  const tabs = [
    { id: "portfolio", label: "Portfolio" },
    { id: "screening", label: "Screening Reel" },
    { id: "process", label: "Process & Workflow" },
    { id: "tools", label: "Tools & Clearance" },
  ] as const;

  return (
    <div className="w-full text-left py-4 md:py-8 px-4 sm:px-6 lg:px-8 max-w-[1360px] mx-auto">
      {/* ======================================================== */}
      {/* 1. INSTAGRAM / META STYLE MINIMALIST PROFILE HEADER      */}
      {/* ======================================================== */}
      <section className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 sm:p-8 shadow-xs mb-8 transition-colors">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 max-w-[840px]">
            {/* Clean Avatar */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[var(--gradient-text-safe)] text-white text-2xl font-bold flex items-center justify-center shrink-0 overflow-hidden shadow-xs border-2 border-[var(--surface)]">
              {creator.avatarUrl ? (
                <img src={creator.avatarUrl} alt={creator.displayName} className="w-full h-full object-cover" />
              ) : (
                creator.displayName.charAt(0)
              )}
            </div>

            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs font-mono text-[var(--link-aa)] font-bold uppercase tracking-wider">
                  @{creator.handle}
                </span>
                {creator.isSample && (
                  <span className="text-[10px] uppercase tracking-wider font-semibold bg-[var(--bg)] border border-[var(--border)] text-[var(--text-secondary-aa)] px-2 py-0.5 rounded-full">
                    Verified Sample
                  </span>
                )}
                <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {availabilityText}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[var(--text)] tracking-tight">
                {creator.displayName}
              </h1>

              <p className="text-sm text-[var(--text-secondary-aa)] leading-relaxed max-w-[680px]">
                {creator.bio || creator.headline}
              </p>

              {/* Verified Tool Badges */}
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                {creator.tools.map((t) => (
                  <span
                    key={t.toolId}
                    className="px-2.5 py-1 bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] text-xs rounded-full font-medium"
                  >
                    {t.name}
                  </span>
                ))}
                <span className="px-2.5 py-1 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-xs rounded-full font-semibold inline-flex items-center gap-1">
                  <CheckIcon size={12} strokeWidth={2.5} />
                  <span>Tools verified</span>
                </span>
              </div>

              {/* Stats Row (Instagram profile metrics) */}
              <div className="flex items-center gap-4 sm:gap-6 text-xs font-mono text-[var(--text-secondary-aa)] pt-2 flex-wrap">
                <div>
                  <strong className="text-[var(--text)] font-bold text-sm block">
                    {creator.portfolio.length}
                  </strong>
                  <span>pieces</span>
                </div>
                <span>·</span>
                <div>
                  <strong className="text-[var(--text)] font-bold text-sm block">
                    {totalTakes}
                  </strong>
                  <span>takes verified</span>
                </div>
                <span>·</span>
                <div>
                  <strong className="text-[var(--text)] font-bold text-sm block">
                    {turnaroundDays}d
                  </strong>
                  <span>turnaround</span>
                </div>
                <span>·</span>
                <div>
                  <strong className="text-emerald-600 dark:text-emerald-400 font-bold text-sm block">
                    ₹{startingPrice.toLocaleString("en-IN")}
                  </strong>
                  <span>from</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex-shrink-0 flex sm:flex-col gap-2.5 pt-2">
            <CreatorActions creator={creator} />
          </div>
        </div>

        {/* Material Design Tab Bar with 2px Active Gradient Underline */}
        <div className="flex items-center gap-2 sm:gap-6 border-b border-[var(--border)] mt-8 pt-2 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  playClickSound();
                  setActiveTab(tab.id);
                }}
                className={`relative pb-3 px-3 text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap min-h-[44px] flex items-center select-none ${
                  isActive
                    ? "text-[var(--text)] font-bold"
                    : "text-[var(--text-secondary-aa)] hover:text-[var(--text)] font-medium"
                }`}
              >
                <span>{tab.label}</span>
                {isActive && (
                  <span
                    className="absolute bottom-0 inset-x-1 h-[2px] rounded-full"
                    style={{ background: "var(--gradient-primary)" }}
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. MAIN LAYOUT: ACTIVE TAB CONTENT + STICKY FIVERR HIRE  */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left / Center Tab Content (8 cols on lg) */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          {/* TAB 1: PORTFOLIO GRID (Instagram 3-column card-based grid) */}
          {activeTab === "portfolio" && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <h2 className="text-lg font-bold text-[var(--text)]">
                  Portfolio Reel ({creator.portfolio.length} pieces)
                </h2>
                <span className="text-xs text-[var(--text-secondary-aa)] font-mono">
                  Aspect 4:5 &amp; 16:9
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {creator.portfolio.map((piece) => (
                  <div
                    key={piece.id}
                    onClick={() => {
                      playClickSound();
                      setSelectedPiece(piece);
                      setActiveTab("screening");
                    }}
                    className="group relative aspect-[4/5] bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden cursor-pointer shadow-xs transition-transform duration-150 hover:-translate-y-1 hover:border-[var(--text-secondary)]"
                  >
                    {piece.posterUrl || piece.mediaUrl ? (
                      <img
                        src={piece.posterUrl || piece.mediaUrl}
                        alt={piece.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-sky-400 via-indigo-500 to-rose-400 flex items-center justify-center p-4 text-center text-white">
                        <span className="font-bold text-sm">{piece.title}</span>
                      </div>
                    )}

                    {/* Gradient Overlay & Take Badge */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3.5 text-white">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-full border border-white/20">
                          {piece.contentType}
                        </span>
                        <span className="text-[10px] font-mono font-bold bg-[var(--link-aa)] px-2 py-0.5 rounded-full">
                          {piece.takesCount || 10} takes
                        </span>
                      </div>

                      <div>
                        <h3 className="text-xs font-bold line-clamp-1 group-hover:text-amber-300 transition-colors">
                          {piece.title}
                        </h3>
                        <p className="text-[11px] text-white/80 line-clamp-2 mt-0.5">
                          {piece.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: SCREENING REEL (Live Take Scrubber) */}
          {activeTab === "screening" && (
            <div className="rounded-2xl overflow-hidden border border-[var(--border)] shadow-xs">
              <ScreeningRoom
                portfolio={creator.portfolio}
                initialPieceId={selectedPiece?.id}
              />
            </div>
          )}

          {/* TAB 3: PROCESS & WORKFLOW */}
          {activeTab === "process" && (
            <div className="flex flex-col gap-8">
              {primaryPiece?.workflow && primaryPiece.workflow.length > 0 && (
                <section className="bg-[var(--surface)] p-6 sm:p-8 rounded-2xl border border-[var(--border)] shadow-xs">
                  <div className="border-b border-[var(--border)] pb-3 mb-6">
                    <span className="text-xs font-mono uppercase tracking-widest text-[var(--link-aa)] font-bold block">
                      Workflow Sequence // {primaryPiece.title}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold text-[var(--text)] tracking-tight mt-1">
                      Production Sequence
                    </h2>
                  </div>

                  <ol className="flex flex-col gap-5">
                    {primaryPiece.workflow.map((step) => (
                      <li
                        key={step.order}
                        className="flex flex-col sm:flex-row items-start gap-4 border-b border-[var(--border)] pb-5 last:border-b-0 last:pb-0"
                      >
                        <div className="flex items-center gap-3 sm:w-28 flex-shrink-0">
                          <span className="w-7 h-7 bg-[var(--link-aa)] text-white font-mono text-xs font-bold flex items-center justify-center rounded-lg">
                            0{step.order}
                          </span>
                          <span className="text-xs font-bold text-[var(--text)]">
                            {step.tool}
                          </span>
                        </div>

                        <div className="flex-1 text-xs text-[var(--text)] leading-relaxed">
                          {step.what}
                        </div>

                        {step.imageUrl && (
                          <div className="w-24 h-16 flex-shrink-0 rounded-lg overflow-hidden border border-[var(--border)]">
                            <MediaFrame
                              src={step.imageUrl}
                              ratio="4:5"
                              alt={`Step ${step.order}`}
                              className="h-full w-full"
                            />
                          </div>
                        )}
                      </li>
                    ))}
                  </ol>
                </section>
              )}

              {/* Node Pipeline Graph */}
              <NodePipelineGraph
                creatorName={creator.displayName}
                pieceTitle={primaryPiece?.title || "Master Generation"}
              />
            </div>
          )}

          {/* TAB 4: TOOLS & CLEARANCE */}
          {activeTab === "tools" && (
            <div className="flex flex-col gap-8">
              {/* Technical Stack Table */}
              <section className="bg-[var(--surface)] p-6 sm:p-8 rounded-2xl border border-[var(--border)] shadow-xs">
                <div className="border-b border-[var(--border)] pb-3 mb-6">
                  <span className="text-xs font-mono uppercase tracking-widest text-[var(--link-aa)] font-bold block">
                    Technical Stack &amp; Verification
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-[var(--text)] tracking-tight mt-1">
                    Generative Tools &amp; Pipelines
                  </h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[var(--border)] text-[var(--text-secondary-aa)] uppercase font-mono tracking-wider">
                        <th className="py-2.5 pr-4">Tool</th>
                        <th className="py-2.5 px-4">Kind</th>
                        <th className="py-2.5 px-4">Primary Use</th>
                        <th className="py-2.5 pl-4">Verification</th>
                      </tr>
                    </thead>
                    <tbody>
                      {creator.tools.map((tool) => {
                        const isVerified =
                          tool.verify === "evidence_attached" ||
                          tool.verify === "reviewed";
                        return (
                          <tr
                            key={tool.toolId}
                            className="border-b border-[var(--border)] hover:bg-[var(--bg)] transition-colors"
                          >
                            <td className="py-3 pr-4 font-bold text-[var(--text)]">
                              {tool.name}
                            </td>
                            <td className="py-3 px-4 capitalize text-[var(--text-secondary-aa)]">
                              {tool.kind}
                            </td>
                            <td className="py-3 px-4 text-[var(--text)]">
                              {tool.usedFor}
                            </td>
                            <td className="py-3 pl-4">
                              <div className="inline-flex items-center gap-1.5 font-medium">
                                {isVerified ? (
                                  <>
                                    <span className="text-emerald-600">
                                      <CheckIcon size={14} strokeWidth={2.5} />
                                    </span>
                                    <span className="text-emerald-600 dark:text-emerald-400 capitalize">
                                      {tool.verify.replace("_", " ")}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-[var(--text-secondary-aa)] capitalize">
                                    {tool.verify.replace("_", " ")}
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Commercial Rights Basis Card */}
              {primaryPiece?.rightsBasis && (
                <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-xs">
                  <span className="text-xs font-mono uppercase tracking-wider text-[var(--link-aa)] font-bold block mb-1">
                    Commercial Clearance
                  </span>
                  <h3 className="text-base font-bold text-[var(--text)]">
                    Rights: {primaryPiece.rights.replace("_", " ")}
                  </h3>
                  <p className="text-xs text-[var(--text)] mt-3 leading-relaxed bg-[var(--bg)] p-3 rounded-xl border-l-2 border-[var(--link-aa)]">
                    &ldquo;{primaryPiece.rightsBasis}&rdquo;
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column (4 cols): Sticky Fiverr-Style Hire Panel */}
        <div className="lg:col-span-4 sticky top-20 flex flex-col gap-6">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-xs flex flex-col gap-5">
            <div className="flex items-baseline justify-between border-b border-[var(--border)] pb-4">
              <div>
                <span className="text-[11px] font-mono text-[var(--text-secondary-aa)] uppercase tracking-wider block">
                  Starting Package
                </span>
                <span className="text-2xl font-black text-[var(--text)]">
                  ₹{startingPrice.toLocaleString("en-IN")}
                </span>
              </div>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                Available
              </span>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div className="flex items-center justify-between text-[var(--text-secondary-aa)]">
                <span>Turnaround Time</span>
                <strong className="text-[var(--text)]">{turnaroundDays} business days</strong>
              </div>
              <div className="flex items-center justify-between text-[var(--text-secondary-aa)]">
                <span>Iteration Proofs</span>
                <strong className="text-[var(--text)]">Up to 23 takes</strong>
              </div>
              <div className="flex items-center justify-between text-[var(--text-secondary-aa)]">
                <span>Deliverable Formats</span>
                <strong className="text-[var(--text)]">{creator.formats.join(", ") || "4:5, 16:9"}</strong>
              </div>
              <div className="flex items-center justify-between text-[var(--text-secondary-aa)]">
                <span>Commercial Rights</span>
                <strong className="text-emerald-600 dark:text-emerald-400">Full Commercial Use</strong>
              </div>
            </div>

            <Link
              href={`/briefs/new?invited=${creator.handle}`}
              onClick={() => playClickSound()}
              className="w-full py-3 bg-[var(--link-aa)] hover:bg-[var(--link-aa-hover)] text-white font-bold text-sm rounded-lg transition-transform hover:scale-[1.02] active:scale-[0.98] text-center shadow-xs flex items-center justify-center gap-2 select-none"
            >
              <span>Continue (₹{startingPrice.toLocaleString("en-IN")})</span>
              <ArrowIcon size={14} />
            </Link>

            {/* Escrow Protection Guarantee Pill */}
            <div className="p-3.5 bg-[var(--bg)] border border-[var(--border)] rounded-xl flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckIcon size={12} strokeWidth={2.5} />
              </div>
              <div className="text-[11px] leading-relaxed text-[var(--text-secondary-aa)]">
                <strong className="text-[var(--text)] block font-semibold mb-0.5">
                  100% Escrow Protected
                </strong>
                Funds are held safely in trust. The creator is only paid once milestone takes and final outputs are approved by you.
              </div>
            </div>
          </div>

          {/* Verification Evidence Card */}
          <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] flex flex-col gap-4 shadow-xs">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-[var(--link-aa)] font-bold block mb-1">
                Trust &amp; Verification Signals
              </span>
              <h3 className="text-base font-bold text-[var(--text)]">
                Marketplace Record
              </h3>
            </div>

            <div className="flex flex-col gap-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg)] border border-[var(--border)]">
                <span className="text-[var(--text-secondary-aa)]">Tool Stack Checked</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">100% Passed</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg)] border border-[var(--border)]">
                <span className="text-[var(--text-secondary-aa)]">Commercial Warranty</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">Active</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg)] border border-[var(--border)]">
                <span className="text-[var(--text-secondary-aa)]">Escrow Released</span>
                <span className="font-bold text-[var(--text)]">14 Completed Jobs</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
