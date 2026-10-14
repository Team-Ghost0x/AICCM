"use client";

import React, { useState } from "react";
import { Brief } from "@/lib/contract/schemas";
import { generateRightsSummary } from "@/lib/contract/rights";
import { RightsCertificateModal } from "./rights-certificate-modal";

interface CallSheetProps {
  brief: Partial<Brief>;
  gapFields?: string[];
  onPublish?: () => void;
  isPublishing?: boolean;
}

export function computeBriefCompleteness(brief: Partial<Brief>): {
  filled: number;
  total: number;
} {
  const checks = [
    Boolean(brief.brandName?.trim()),
    Boolean(brief.title?.trim()),
    Boolean(brief.objective?.trim()),
    Boolean(brief.requirements?.trim()),
    Boolean(brief.contentType),
    Boolean(brief.formats && brief.formats.length > 0),
    Boolean(brief.deliverablesCount && brief.deliverablesCount > 0),
    Boolean(brief.preferredTools && brief.preferredTools.length > 0),
    Boolean(brief.budgetInr && brief.budgetInr.min > 0 && brief.budgetInr.max >= brief.budgetInr.min),
    Boolean(brief.deadline?.trim()),
    Boolean(brief.commercialUse?.uses && brief.commercialUse.uses.length > 0),
    Boolean(brief.commercialUse?.territory && brief.commercialUse?.termMonths),
  ];

  const filled = checks.filter(Boolean).length;
  return { filled, total: 12 };
}

export function CallSheet({
  brief,
  gapFields = [],
  onPublish,
  isPublishing = false,
}: CallSheetProps) {
  const [showCertModal, setShowCertModal] = useState(false);
  const { filled, total } = computeBriefCompleteness(brief);
  const isGap = (field: string) => gapFields.includes(field);

  return (
    <div className="w-full bg-[var(--surface)] p-6 text-left border border-[var(--border)] rounded-2xl flex flex-col gap-5 shadow-xs">
      {/* Document Header */}
      <div className="border-b border-[var(--border)] pb-4 flex items-start justify-between">
        <div>
          <span className="text-[11px] uppercase tracking-widest font-mono text-[var(--text-secondary-aa)] block">
            Production Document // Live Call Sheet
          </span>
          <h2 className="text-xl font-black text-[var(--text)] tracking-tight mt-0.5">
            {brief.title?.trim() || "Untitled Campaign Brief"}
          </h2>
          <span className="text-xs text-[var(--text-secondary-aa)] block mt-0.5">
            Brand: <strong className="text-[var(--text)]">{brief.brandName?.trim() || "Unspecified"}</strong>
          </span>
        </div>

        {/* Real-time Completeness Counter */}
        <div className="text-right">
          <span className="text-xs uppercase tracking-wider text-[var(--text-secondary-aa)] block font-mono">
            Completeness
          </span>
          <span className="text-lg font-black tabular-numbers text-[var(--text)]">
            {filled} of {total} filled
          </span>
        </div>
      </div>

      {/* Structured Fields Grid */}
      <div className="flex flex-col gap-4 text-xs">
        {/* Objective */}
        <div
          className={`p-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl transition-all ${
            isGap("objective")
              ? "border-l-4 border-l-[var(--danger-aa)]"
              : "border-l-2 border-l-[var(--link-aa)]"
          }`}
        >
          <div className="flex justify-between items-center mb-1">
            <span className="font-semibold uppercase tracking-wider text-[var(--text-secondary-aa)]">
              Campaign Objective
            </span>
            {isGap("objective") && (
              <span className="text-[var(--danger-aa)] font-bold text-[11px]">
                Needs your answer
              </span>
            )}
          </div>
          <p className="text-[var(--text)] leading-relaxed">
            {brief.objective?.trim() || "Pending objective definition."}
          </p>
        </div>

        {/* Content Type & Formats */}
        <div
          className={`p-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl transition-all ${
            isGap("formats") || isGap("contentType")
              ? "border-l-4 border-l-[var(--danger-aa)]"
              : "border-l-2 border-l-[var(--link-aa)]"
          }`}
        >
          <div className="flex justify-between items-center mb-1">
            <span className="font-semibold uppercase tracking-wider text-[var(--text-secondary-aa)]">
              Deliverables &amp; Format
            </span>
            {(isGap("formats") || isGap("contentType")) && (
              <span className="text-[var(--danger-aa)] font-bold text-[11px]">
                Needs your answer
              </span>
            )}
          </div>
          <p className="text-[var(--text)]">
            {brief.deliverablesCount || 1}x {brief.contentType || "mixed"} asset(s)
            {" · "}
            {brief.formats && brief.formats.length > 0
              ? brief.formats.map((f) => f.aspectRatio).join(", ")
              : "No aspect ratios selected"}
          </p>
        </div>

        {/* Budget & Timeline */}
        <div
          className={`p-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl transition-all ${
            isGap("budgetInr") || isGap("deadline")
              ? "border-l-4 border-l-[var(--danger-aa)]"
              : "border-l-2 border-l-[var(--link-aa)]"
          }`}
        >
          <div className="flex justify-between items-center mb-1">
            <span className="font-semibold uppercase tracking-wider text-[var(--text-secondary-aa)]">
              Budget &amp; Target Timeline
            </span>
            {(isGap("budgetInr") || isGap("deadline")) && (
              <span className="text-[var(--danger-aa)] font-bold text-[11px]">
                Needs your answer
              </span>
            )}
          </div>
          <div className="flex justify-between text-[var(--text)]">
            <span>
              Budget:{" "}
              {brief.budgetInr
                ? `₹${brief.budgetInr.min.toLocaleString("en-IN")} – ₹${brief.budgetInr.max.toLocaleString("en-IN")}`
                : "Not specified"}
            </span>
            <span>
              Deadline:{" "}
              {brief.deadline
                ? new Date(brief.deadline).toLocaleDateString("en-IN")
                : "Not specified"}
            </span>
          </div>
        </div>

        {/* Preferred Tools */}
        <div className="p-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl border-l-2 border-l-[var(--link-aa)]">
          <span className="font-semibold uppercase tracking-wider text-[var(--text-secondary-aa)] block mb-1">
            Preferred AI Stack
          </span>
          <p className="text-[var(--text)]">
            {brief.preferredTools && brief.preferredTools.length > 0
              ? brief.preferredTools.join(", ")
              : "Open to creator pipeline"}
          </p>
        </div>

        {/* Commercial Use live preview */}
        {brief.commercialUse && (
          <div
            className={`p-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl transition-all ${
              isGap("commercialUse")
                ? "border-l-4 border-l-[var(--danger-aa)]"
                : "border-l-2 border-l-[var(--link-aa)]"
            }`}
          >
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold uppercase tracking-wider text-[var(--text-secondary-aa)]">
                Commercial Terms
              </span>
              {isGap("commercialUse") && (
                <span className="text-[var(--danger-aa)] font-bold text-[11px]">
                  Needs your answer
                </span>
              )}
            </div>
            <p className="text-[var(--text)] italic">
              {generateRightsSummary(brief.commercialUse)}
            </p>
            <button
              type="button"
              onClick={() => setShowCertModal(true)}
              className="mt-2 text-[11px] font-mono text-[var(--link-aa)] underline font-bold hover:text-[var(--link-aa-hover)] cursor-pointer"
            >
              [PASS] Preview AI Commercial Rights Pass
            </button>
          </div>
        )}
      </div>

      {/* Action CTA with tactile animation */}
      {onPublish && (
        <button
          type="button"
          onClick={onPublish}
          disabled={isPublishing}
          className="w-full bg-[var(--link-aa)] hover:bg-[var(--link-aa-hover)] text-white font-bold py-3.5 px-4 rounded-lg text-sm shadow-xs transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50 select-none"
        >
          {isPublishing ? "Publishing brief..." : "Publish brief"}
        </button>
      )}

      {/* Commercial Clearance Certificate Modal */}
      {brief.commercialUse && (
        <RightsCertificateModal
          isOpen={showCertModal}
          onClose={() => setShowCertModal(false)}
          commercialUse={brief.commercialUse}
          campaignTitle={brief.title || "Campaign Brief"}
          brandName={brief.brandName || "Brand Partner"}
        />
      )}
    </div>
  );
}
