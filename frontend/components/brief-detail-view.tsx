"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Brief, MatchResult } from "@/lib/contract/schemas";
import {
  fetchBriefById,
  fetchBriefMatches,
  fetchApplicationsForBrief,
  submitProposalToBrief,
  updateProposalStatus,
  ApplicationProposal,
} from "@/lib/client/api";
import { CreatorRow } from "@/components/creator-row";
import { generateRightsSummary } from "@/lib/contract/rights";
import { CheckIcon, ArrowIcon, OrdersIcon, CloseIcon } from "@/components/icons";
import { getCurrentUser } from "@/lib/client/auth";
import { playClickSound } from "@/lib/client/audio";

interface BriefDetailViewProps {
  initialBrief: Brief;
  initialMatches: MatchResult[];
  briefId: string;
}

export function BriefDetailView({
  initialBrief,
  initialMatches,
  briefId,
}: BriefDetailViewProps) {
  const [brief, setBrief] = useState<Brief>(initialBrief);
  const [matches, setMatches] = useState<MatchResult[]>(initialMatches);
  const [applications, setApplications] = useState<ApplicationProposal[]>([]);
  const [activeTab, setActiveTab] = useState<"proposals" | "matches">("proposals");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [user, setUser] = useState(() => getCurrentUser());

  // Proposal submission modal state
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [proposedPrice, setProposedPrice] = useState<number>(brief.budgetInr?.min || 30000);
  const [deliveryDays, setDeliveryDays] = useState<number>(7);
  const [proposalPitch, setProposalPitch] = useState("");
  const [selectedTools, setSelectedTools] = useState<string[]>(brief.preferredTools || []);
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);

  const loadApplications = () => {
    fetchApplicationsForBrief(briefId).then((apps) => {
      setApplications(apps);
    }).catch(() => {});
  };

  useEffect(() => {
    let isCurrent = true;

    fetchBriefById(briefId).then((loadedBrief) => {
      if (!isCurrent) return;
      setBrief(loadedBrief);
      fetchBriefMatches(briefId).then((loadedMatches) => {
        if (!isCurrent) return;
        setMatches(loadedMatches);
      });
    });

    loadApplications();

    return () => {
      isCurrent = false;
    };
  }, [briefId]);

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposalPitch.trim()) return;

    setIsSubmittingProposal(true);
    playClickSound();

    try {
      await submitProposalToBrief(briefId, {
        proposedPriceInr: proposedPrice,
        deliveryDays,
        proposalText: proposalPitch.trim(),
        relevantTools: selectedTools,
      });

      setShowApplyModal(false);
      setProposalPitch("");
      setToastMessage("Proposal submitted successfully!");
      loadApplications();

      setTimeout(() => {
        setToastMessage(null);
      }, 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit proposal.";
      alert(msg);
    } finally {
      setIsSubmittingProposal(false);
    }
  };

  const handleStatusChange = async (
    appId: string,
    newStatus: "shortlisted" | "accepted" | "rejected"
  ) => {
    playClickSound();
    try {
      await updateProposalStatus(briefId, appId, newStatus);
      setToastMessage(
        newStatus === "accepted"
          ? "Proposal accepted! Project initialized in Tracker."
          : `Proposal marked as ${newStatus}.`
      );
      loadApplications();

      setTimeout(() => {
        setToastMessage(null);
      }, 5000);
    } catch {
      alert("Failed to update proposal status.");
    }
  };

  const isCreator = user?.role === "creator";
  const isBrand = user?.role === "brand" || user?.role === "admin";

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 text-left flex flex-col gap-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] px-4 py-3 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-3 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>{toastMessage}</span>
          <Link
            href="/tracker"
            className="underline text-[var(--link-aa)] hover:text-[var(--link-aa-hover)] ml-1 font-bold"
          >
            Open workspace
          </Link>
        </div>
      )}

      {/* Page Title & Status */}
      <div className="border-b border-[var(--border)] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-secondary-aa)] font-bold">
              Campaign Brief // {brief.id}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
              {brief.status}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[var(--text)] tracking-tight">
            {brief.title}
          </h1>
          <span className="text-xs sm:text-sm text-[var(--text-secondary-aa)] mt-1 block">
            Commissioned by <strong className="text-[var(--text)] font-semibold">{brief.brandName}</strong>
          </span>
        </div>

        <div className="flex items-center gap-3">
          {isCreator && (
            <button
              type="button"
              onClick={() => setShowApplyModal(true)}
              className="bg-[var(--link-aa)] hover:bg-[var(--link-aa-hover)] text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-xs transition-transform hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <span>Submit Proposal</span>
              <ArrowIcon size={14} />
            </button>
          )}

          <Link
            href="/briefs"
            className="bg-[var(--surface)] hover:bg-[var(--bg)] text-[var(--text)] border border-[var(--border)] font-semibold text-xs px-3.5 py-2.5 rounded-xl transition-colors"
          >
            Browse All Briefs
          </Link>
        </div>
      </div>

      {/* Main Grid: Left Brief Summary, Right Tabbed Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Brief Dossier (4 cols) */}
        <div className="lg:col-span-4 bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-xs flex flex-col gap-5 text-xs">
          <div className="border-b border-[var(--border)] pb-3">
            <h2 className="text-base font-bold text-[var(--text)]">
              Brief Dossier
            </h2>
          </div>

          <div>
            <span className="font-semibold uppercase tracking-wider text-[var(--text-secondary-aa)] block mb-1 text-[10px]">
              Campaign Objective
            </span>
            <p className="text-[var(--text)] leading-relaxed">{brief.objective}</p>
          </div>

          <div>
            <span className="font-semibold uppercase tracking-wider text-[var(--text-secondary-aa)] block mb-1 text-[10px]">
              Requirements &amp; Scope
            </span>
            <p className="text-[var(--text)] leading-relaxed">{brief.requirements}</p>
          </div>

          <div>
            <span className="font-semibold uppercase tracking-wider text-[var(--text-secondary-aa)] block mb-1 text-[10px]">
              Deliverables &amp; Formats
            </span>
            <p className="text-[var(--text)]">
              {brief.deliverablesCount}x {brief.contentType} asset(s) · {brief.formats.map((f) => f.aspectRatio).join(", ")}
            </p>
          </div>

          <div>
            <span className="font-semibold uppercase tracking-wider text-[var(--text-secondary-aa)] block mb-1 text-[10px]">
              Budget &amp; Target Deadline
            </span>
            <p className="text-[var(--text)] tabular-numbers">
              Budget:{" "}
              {brief.budgetInr
                ? `₹${brief.budgetInr.min.toLocaleString("en-IN")} – ₹${brief.budgetInr.max.toLocaleString("en-IN")}`
                : "Open"}
              <br />
              Deadline:{" "}
              {brief.deadline
                ? new Date(brief.deadline).toLocaleDateString("en-IN")
                : "Flexible"}
            </p>
          </div>

          <div>
            <span className="font-semibold uppercase tracking-wider text-[var(--text-secondary-aa)] block mb-1 text-[10px]">
              Commercial Terms
            </span>
            <p className="text-[var(--text)] leading-relaxed italic bg-[var(--bg)] p-3 rounded-xl border border-[var(--border)]">
              {generateRightsSummary(brief.commercialUse)}
            </p>
          </div>

          <div>
            <span className="font-semibold uppercase tracking-wider text-[var(--text-secondary-aa)] block mb-1.5 text-[10px]">
              Preferred Tools
            </span>
            <div className="flex flex-wrap gap-1.5">
              {brief.preferredTools.map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded bg-[var(--bg)] border border-[var(--border)] text-[var(--text-secondary-aa)] font-mono text-[10px] uppercase font-semibold"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Tabbed Section (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Tab Switcher */}
          <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
            <button
              type="button"
              onClick={() => setActiveTab("proposals")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "proposals"
                  ? "bg-[var(--surface)] text-[var(--text)] shadow-xs border border-[var(--border)]"
                  : "text-[var(--text-secondary-aa)] hover:text-[var(--text)]"
              }`}
            >
              Received Proposals ({applications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("matches")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "matches"
                  ? "bg-[var(--surface)] text-[var(--text)] shadow-xs border border-[var(--border)]"
                  : "text-[var(--text-secondary-aa)] hover:text-[var(--text)]"
              }`}
            >
              AI Pipeline Matches ({matches.length})
            </button>
          </div>

          {/* TAB 1: RECEIVED PROPOSALS */}
          {activeTab === "proposals" && (
            <div className="flex flex-col gap-4">
              {applications.length === 0 ? (
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-10 text-center flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary-aa)]">
                    <OrdersIcon size={20} />
                  </div>
                  <h3 className="text-base font-bold text-[var(--text)]">No proposals submitted yet</h3>
                  <p className="text-xs text-[var(--text-secondary-aa)] max-w-sm">
                    Creators can review this brief and submit detailed proposals with their rates, milestones, and tool workflows.
                  </p>
                  {isCreator && (
                    <button
                      type="button"
                      onClick={() => setShowApplyModal(true)}
                      className="mt-2 px-4 py-2 bg-[var(--link-aa)] hover:bg-[var(--link-aa-hover)] text-white text-xs font-bold rounded-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
                    >
                      Be the First to Apply
                    </button>
                  )}
                </div>
              ) : (
                applications.map((app) => (
                  <div
                    key={app.id}
                    className="bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] shadow-xs flex flex-col gap-4 text-xs"
                  >
                    {/* Header: Creator & Proposed Terms */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-[var(--gradient-text-safe)] text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {app.creatorName.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-[var(--text)]">
                            {app.creatorName}
                          </h3>
                          <span className="text-[11px] text-[var(--text-secondary-aa)]">
                            Applied {new Date(app.createdAt).toLocaleDateString("en-IN")}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-sm font-bold text-[var(--text)] block tabular-numbers">
                            ₹{app.proposedPriceInr?.toLocaleString("en-IN")}
                          </span>
                          <span className="text-[11px] text-[var(--text-secondary-aa)]">
                            {app.deliveryDays} days turnaround
                          </span>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            app.status === "accepted"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300"
                              : app.status === "shortlisted"
                              ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300"
                              : app.status === "rejected"
                              ? "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-300"
                              : "bg-[var(--bg)] text-[var(--text-secondary-aa)] border border-[var(--border)]"
                          }`}
                        >
                          {app.status}
                        </span>
                      </div>
                    </div>

                    {/* Proposal Pitch Text */}
                    <p className="text-[var(--text)] leading-relaxed">
                      {app.proposalText}
                    </p>

                    {/* Tools Used */}
                    {app.relevantTools && app.relevantTools.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] text-[var(--text-secondary-aa)] font-medium mr-1">
                          Tools proposed:
                        </span>
                        {app.relevantTools.map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded bg-[var(--bg)] border border-[var(--border)] text-[var(--text-secondary-aa)] text-[10px] uppercase font-mono font-semibold"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Brand Action Buttons */}
                    {isBrand && app.status !== "accepted" && (
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(app.id, "rejected")}
                          className="px-3 py-1.5 text-xs text-[var(--text-secondary-aa)] hover:text-red-600 transition-colors cursor-pointer"
                        >
                          Decline
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(app.id, "shortlisted")}
                          className="px-3.5 py-1.5 bg-[var(--bg)] hover:bg-[var(--border)] text-[var(--text)] text-xs font-semibold rounded-lg border border-[var(--border)] transition-colors cursor-pointer"
                        >
                          Shortlist
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(app.id, "accepted")}
                          className="px-4 py-1.5 bg-[var(--link-aa)] hover:bg-[var(--link-aa-hover)] text-white text-xs font-bold rounded-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
                        >
                          Accept &amp; Start Project
                        </button>
                      </div>
                    )}

                    {app.status === "accepted" && (
                      <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                          <CheckIcon size={14} />
                          <span>Accepted Proposal</span>
                        </span>
                        <Link
                          href="/tracker"
                          className="text-xs font-bold text-[var(--link-aa)] hover:underline flex items-center gap-1"
                        >
                          <span>Open in Workspace</span>
                          <ArrowIcon size={12} />
                        </Link>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: AI PIPELINE MATCHES */}
          {activeTab === "matches" && (
            <div className="flex flex-col gap-5">
              {matches.map((match, index) => {
                const { creator, score, reasons } = match;

                return (
                  <div
                    key={creator.id}
                    className="bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] shadow-xs flex flex-col gap-4 text-xs transition-all hover:border-[var(--link-aa)]"
                  >
                    {/* Match Rank & Score */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-mono font-bold bg-[var(--text)] text-[var(--surface)] px-2 py-0.5 rounded-md">
                          Rank #{index + 1}
                        </span>
                        <span className="text-sm font-bold text-[var(--text)]">
                          {creator.displayName}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--text-secondary-aa)]">Match Fit:</span>
                        <span className="text-sm font-bold text-[var(--text)] tabular-numbers">
                          {score}%
                        </span>
                        <div className="w-16 h-2 bg-[var(--bg)] rounded-full overflow-hidden border border-[var(--border)]">
                          <div
                            style={{ width: `${score}%` }}
                            className={`h-full transition-all duration-500 ${
                              score >= 80 ? "bg-emerald-600" : score >= 60 ? "bg-blue-600" : "bg-amber-600"
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    <CreatorRow creator={creator} />

                    {/* Match Reasons */}
                    <div className="bg-[var(--bg)] p-3 rounded-xl border border-[var(--border)] flex flex-col gap-1.5">
                      <span className="font-bold text-[var(--text)] uppercase tracking-wider text-[10px]">
                        Algorithmic match breakdown:
                      </span>
                      <ul className="flex flex-col gap-1 text-[var(--text-secondary-aa)]">
                        {reasons.map((r, rIdx) => (
                          <li key={rIdx} className="flex items-start gap-1.5">
                            <span className="text-[var(--link-aa)] font-bold">·</span>
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex justify-end items-center gap-3 pt-1 border-t border-[var(--border)]">
                      <Link
                        href={`/creators/${creator.handle}`}
                        className="text-xs font-semibold text-[var(--link-aa)] hover:underline"
                      >
                        Inspect portfolio &amp; takes
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Proposal Submission Modal (For Creators) */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] w-full max-w-lg p-6 rounded-2xl shadow-xl flex flex-col gap-4 text-xs text-left">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div>
                <h3 className="text-lg font-bold text-[var(--text)]">
                  Submit Proposal for &ldquo;{brief.title}&rdquo;
                </h3>
                <p className="text-xs text-[var(--text-secondary-aa)] mt-0.5">
                  Propose your production quote, delivery timeline, and generative workflow.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowApplyModal(false)}
                className="text-[var(--text-secondary-aa)] hover:text-[var(--text)] p-1 rounded-md cursor-pointer"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="flex flex-col gap-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[var(--text)] block mb-1">
                    Proposed Price (₹ INR)
                  </label>
                  <input
                    type="number"
                    value={proposedPrice}
                    onChange={(e) => setProposedPrice(Number(e.target.value))}
                    min={1000}
                    step={1000}
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--link-aa)]"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-[var(--text)] block mb-1">
                    Delivery Timeline (Days)
                  </label>
                  <input
                    type="number"
                    value={deliveryDays}
                    onChange={(e) => setDeliveryDays(Number(e.target.value))}
                    min={1}
                    max={60}
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--link-aa)]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-[var(--text)] block mb-1">
                  Creative Approach &amp; Production Pitch
                </label>
                <textarea
                  value={proposalPitch}
                  onChange={(e) => setProposalPitch(e.target.value)}
                  placeholder="Detail your generation pipeline, reference prompt approach, and how you will deliver the requested aspect ratios..."
                  rows={4}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-3 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--link-aa)]"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-[var(--text)] block mb-1">
                  Tools &amp; Models You Will Use
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {["runway-gen3", "kling-1.5", "midjourney-v6", "comfyui", "flux-1-dev", "magnific-8k"].map((t) => {
                    const isSelected = selectedTools.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setSelectedTools(
                            isSelected ? selectedTools.filter((x) => x !== t) : [...selectedTools, t]
                          );
                        }}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-[var(--link-aa)] text-white font-bold"
                            : "bg-[var(--bg)] border border-[var(--border)] text-[var(--text-secondary-aa)]"
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[var(--text-secondary-aa)] hover:text-[var(--text)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProposal}
                  className="px-5 py-2 bg-[var(--link-aa)] hover:bg-[var(--link-aa-hover)] text-white text-xs font-bold rounded-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSubmittingProposal ? "Submitting..." : "Send Proposal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
