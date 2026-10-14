"use client";

import React, { useState, useEffect } from "react";
import { CommercialUse } from "@/lib/contract/schemas";
import { generateRightsSummary } from "@/lib/contract/rights";
import { CloseIcon, CheckIcon } from "./icons";
import { playClickSound, playSuccessChime } from "@/lib/client/audio";

interface RightsCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  commercialUse: CommercialUse;
  campaignTitle?: string;
  brandName?: string;
}

export function RightsCertificateModal({
  isOpen,
  onClose,
  commercialUse,
  campaignTitle = "AI Commercial Campaign",
  brandName = "Brand Partner",
}: RightsCertificateModalProps) {
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const certId =
    "RTK-CERT-" +
    Math.abs(
      campaignTitle.split("").reduce((acc, c) => acc + c.charCodeAt(0), 1024)
    )
      .toString(16)
      .toUpperCase() +
    "-2026";

  useEffect(() => {
    if (isOpen) {
      playSuccessChime();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyHash = () => {
    playClickSound();
    navigator.clipboard?.writeText?.(
      `Retake Commercial Clearance Certificate #${certId} | Warranty: Non-training compliant | Territory: ${commercialUse.territory.toUpperCase()} | Clearance Status: VERIFIED`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2400);
  };

  const handleDownloadJson = () => {
    playClickSound();
    const certPayload = {
      certificateId: certId,
      issuedAt: new Date().toISOString(),
      platform: "Retake AI Creator Studio",
      licensingScope: {
        campaignTitle,
        brandName,
        territory: commercialUse.territory,
        termMonths: commercialUse.termMonths,
        rightsTransfer: commercialUse.rightsTransfer,
        exclusivity: commercialUse.exclusivity,
        noModelTraining: commercialUse.noModelTraining,
        aiDisclosure: commercialUse.aiDisclosure,
        allowedUses: commercialUse.uses,
      },
      warrantyClause: generateRightsSummary(commercialUse),
      verificationStatus: "VERIFIED_AUTHENTIC",
    };

    const blob = new Blob([JSON.stringify(certPayload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${certId}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#000000]/85 flex items-center justify-center p-4">
      <div className="bg-[var(--panel)] border-2 border-[var(--border-color)] w-full max-w-lg p-6 sm:p-7 flex flex-col gap-5 text-left text-xs select-none max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b-2 border-[var(--border-color)] pb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full tally bg-[#0b7a43] animate-pulse inline-block" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)] font-bold">
                Retake Verified Legal Clearance Pass
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-[var(--ink)] tracking-tight">
              AI Commercial Clearance Certificate
            </h3>
            <span className="text-xs font-mono text-[var(--muted)] block mt-0.5">
              Certificate No: #{certId}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--muted)] hover:text-[var(--ink)] p-1.5 cursor-pointer transition-colors"
            aria-label="Close certificate modal"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Certificate Card Body */}
        <div className="bg-[var(--paper)] p-5 border-2 border-[var(--border-color)] flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
            <div>
              <span className="text-[10px] font-mono text-[var(--muted)] uppercase block">Licensed For:</span>
              <strong className="text-sm text-[var(--ink)] block">{campaignTitle}</strong>
              <span className="text-xs text-[var(--muted)]">{brandName}</span>
            </div>
            <div className="bg-[#0b7a43] text-[#ffffff] font-mono text-[10px] font-bold px-2.5 py-1 flex items-center gap-1 rounded-[2px]">
              <CheckIcon size={12} strokeWidth={2.5} />
              <span>CLEARED</span>
            </div>
          </div>

          {/* Legal Warranty Signals */}
          <div className="flex flex-col gap-2 font-mono text-[11px]">
            <div className="flex items-center justify-between p-2 bg-[var(--panel)] border border-[var(--border-color)]">
              <span className="text-[var(--muted)]">No-Model-Training Clause:</span>
              <span className="text-[#0b7a43] font-bold">
                {commercialUse.noModelTraining ? "Guaranteed (Prohibited)" : "Permitted"}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 bg-[var(--panel)] border border-[var(--border-color)]">
              <span className="text-[var(--muted)]">Licensing Scope:</span>
              <span className="text-[var(--ink)] font-bold capitalize">
                {commercialUse.rightsTransfer} ({commercialUse.exclusivity} exclusivity)
              </span>
            </div>

            <div className="flex items-center justify-between p-2 bg-[var(--panel)] border border-[var(--border-color)]">
              <span className="text-[var(--muted)]">Territory Clearance:</span>
              <span className="text-[var(--ink)] font-bold uppercase">
                {commercialUse.territory}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 bg-[var(--panel)] border border-[var(--border-color)]">
              <span className="text-[var(--muted)]">Term Duration:</span>
              <span className="text-[var(--ink)] font-bold">
                {commercialUse.termMonths === 0 ? "Perpetual" : `${commercialUse.termMonths} Months`}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 bg-[var(--panel)] border border-[var(--border-color)]">
              <span className="text-[var(--muted)]">AI Generation Disclosure:</span>
              <span className="text-[var(--ink)] font-bold capitalize">
                {commercialUse.aiDisclosure.replace("_", " ")}
              </span>
            </div>
          </div>

          <div className="p-3 bg-[var(--panel-elevated)] border-l-2 border-[var(--tally)] text-xs text-[var(--ink)] leading-relaxed italic">
            &ldquo;{generateRightsSummary(commercialUse)}&rdquo;
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyHash}
              className="bg-[var(--ink)] hover:bg-[var(--muted)] text-[var(--paper)] font-bold text-xs px-3.5 py-2 rounded-[2px] transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {copied ? (
                <>
                  <CheckIcon size={14} />
                  <span>Hash Copied!</span>
                </>
              ) : (
                <span>Copy Hash</span>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadJson}
              className="bg-[var(--paper)] hover:bg-[var(--panel-elevated)] text-[var(--ink)] border border-[var(--border-color)] font-bold text-xs px-3.5 py-2 rounded-[2px] transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {downloaded ? (
                <>
                  <CheckIcon size={14} />
                  <span>Spec Downloaded!</span>
                </>
              ) : (
                <span>Download Spec (JSON)</span>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="bg-[var(--paper)] hover:bg-[var(--panel-elevated)] text-[var(--ink)] border border-[var(--border-color)] font-bold text-xs px-4 py-2 rounded-[2px] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

