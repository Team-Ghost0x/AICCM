"use client";

import React, { useState } from "react";
import { CommercialUse, Usage } from "@/lib/contract/schemas";
import { generateRightsSummary } from "@/lib/contract/rights";
import { CheckIcon } from "./icons";
import { RightsCertificateModal } from "./rights-certificate-modal";
import { playClickSound } from "@/lib/client/audio";

interface RightsMatrixProps {
  value: CommercialUse;
  onChange: (value: CommercialUse) => void;
}

const USAGE_OPTIONS: { id: Usage; label: string }[] = [
  { id: "organic_social", label: "Organic social" },
  { id: "paid_social", label: "Paid social" },
  { id: "broadcast_ctv", label: "Broadcast & CTV" },
  { id: "out_of_home", label: "Out of home" },
  { id: "website", label: "Website" },
  { id: "internal_only", label: "Internal only" },
];

const MONTH_STEPS = [3, 6, 12, 24, 36];

export function RightsMatrix({ value, onChange }: RightsMatrixProps) {
  const [showCertModal, setShowCertModal] = useState(false);

  const toggleUsage = (use: Usage) => {
    playClickSound();
    const exists = value.uses.includes(use);
    const newUses = exists
      ? value.uses.filter((u) => u !== use)
      : [...value.uses, use];
    onChange({ ...value, uses: newUses });
  };

  const handleStepMonth = (direction: "prev" | "next") => {
    playClickSound();
    const currentIdx = MONTH_STEPS.indexOf(value.termMonths);
    if (direction === "prev" && currentIdx > 0) {
      onChange({ ...value, termMonths: MONTH_STEPS[currentIdx - 1] });
    } else if (direction === "next" && currentIdx < MONTH_STEPS.length - 1) {
      onChange({ ...value, termMonths: MONTH_STEPS[currentIdx + 1] });
    }
  };

  const summary = generateRightsSummary(value);

  return (
    <>
      <div className="bg-[var(--panel)] p-5 border border-[var(--border-color)] flex flex-col gap-5 text-left">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
          <h3 className="text-base font-bold text-[var(--ink)]">
            Commercial Use &amp; Rights Matrix
          </h3>
          <span className="text-xs text-[var(--muted)] font-mono">Structured terms</span>
        </div>

        {/* Where will it run? */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">
            Where will it run? (Select all that apply)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {USAGE_OPTIONS.map(({ id, label }) => {
              const active = value.uses.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleUsage(id)}
                  className={`text-xs px-3 py-2 text-left rounded-[3px] border border-[var(--border-color)] transition-colors cursor-pointer ${
                    active
                      ? "bg-[var(--ink)] text-[var(--paper)] font-semibold"
                      : "bg-[var(--paper)] text-[var(--ink)] hover:bg-[var(--panel-elevated)]"
                  }`}
                >
                  {active ? (
                    <CheckIcon size={12} strokeWidth={2.5} className="inline mr-1 align-text-bottom text-[#0b7a43]" />
                  ) : (
                    "+ "
                  )}
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Territory & Duration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Territory */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">
              Territory
            </label>
            <div className="flex gap-2">
              {(
                [
                  { id: "india", label: "India" },
                  { id: "apac", label: "APAC" },
                  { id: "global", label: "Global" },
                ] as const
              ).map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    playClickSound();
                    onChange({ ...value, territory: id });
                  }}
                  className={`flex-1 text-xs py-2 rounded-[3px] border border-[var(--border-color)] transition-colors cursor-pointer ${
                    value.territory === id
                      ? "bg-[var(--ink)] text-[var(--paper)] font-semibold"
                      : "bg-[var(--paper)] text-[var(--ink)] hover:bg-[var(--panel-elevated)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Duration stepper */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">
              Term Duration
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleStepMonth("prev")}
                disabled={value.termMonths <= MONTH_STEPS[0]}
                className="px-3 py-1.5 bg-[var(--paper)] text-[var(--ink)] border border-[var(--border-color)] rounded-[3px] text-xs font-bold disabled:opacity-40 cursor-pointer hover:bg-[var(--panel-elevated)]"
              >
                -
              </button>
              <div className="flex-1 text-center bg-[var(--paper)] text-[var(--ink)] border border-[var(--border-color)] py-1.5 text-xs font-bold tabular-numbers">
                {value.termMonths} Months
              </div>
              <button
                type="button"
                onClick={() => handleStepMonth("next")}
                disabled={value.termMonths >= MONTH_STEPS[MONTH_STEPS.length - 1]}
                className="px-3 py-1.5 bg-[var(--paper)] text-[var(--ink)] border border-[var(--border-color)] rounded-[3px] text-xs font-bold disabled:opacity-40 cursor-pointer hover:bg-[var(--panel-elevated)]"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Exclusivity, Rights Transfer, and AI Disclosure */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">
              Exclusivity
            </label>
            <select
              value={value.exclusivity}
              onChange={(e) => {
                playClickSound();
                onChange({
                  ...value,
                  exclusivity: e.target.value as CommercialUse["exclusivity"],
                });
              }}
              className="w-full bg-[var(--paper)] text-[var(--ink)] border border-[var(--border-color)] text-xs py-2 px-2 rounded-[3px]"
            >
              <option value="none">None</option>
              <option value="category">Our category</option>
              <option value="full">Full exclusivity</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">
              Rights
            </label>
            <div className="flex gap-2">
              {(["license", "buyout"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    playClickSound();
                    onChange({ ...value, rightsTransfer: mode });
                  }}
                  className={`flex-1 text-xs py-2 rounded-[3px] border border-[var(--border-color)] capitalize cursor-pointer ${
                    value.rightsTransfer === mode
                      ? "bg-[var(--ink)] text-[var(--paper)] font-semibold"
                      : "bg-[var(--paper)] text-[var(--ink)] hover:bg-[var(--panel-elevated)]"
                  }`}
                >
                  {mode === "license" ? "Licence" : "Buyout"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">
              AI Disclosure
            </label>
            <select
              value={value.aiDisclosure}
              onChange={(e) => {
                playClickSound();
                onChange({
                  ...value,
                  aiDisclosure: e.target.value as CommercialUse["aiDisclosure"],
                });
              }}
              className="w-full bg-[var(--paper)] text-[var(--ink)] border border-[var(--border-color)] text-xs py-2 px-2 rounded-[3px]"
            >
              <option value="must_label">Must be labelled</option>
              <option value="creator_discretion">Creator discretion</option>
            </select>
          </div>
        </div>

        {/* Model Training Checkbox */}
        <div className="flex items-center gap-2 pt-1">
          <input
            id="no-model-training"
            type="checkbox"
            checked={value.noModelTraining}
            onChange={(e) => {
              playClickSound();
              onChange({ ...value, noModelTraining: e.target.checked });
            }}
            className="w-4 h-4 rounded-none accent-[var(--ink)] cursor-pointer"
          />
          <label
            htmlFor="no-model-training"
            className="text-xs text-[var(--ink)] font-medium cursor-pointer"
          >
            Outputs must not be used to train AI models
          </label>
        </div>

        {/* Live plain-language summary line with Instant Certificate Action */}
        <div className="mt-1 p-3 bg-[var(--panel-elevated)] text-xs text-[var(--ink)] font-medium leading-relaxed border-l-2 border-[var(--tally)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <span className="font-bold">Rights Summary: </span>
            <span>{summary}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              playClickSound();
              setShowCertModal(true);
            }}
            className="whitespace-nowrap px-3 py-1.5 bg-[var(--ink)] text-[var(--paper)] hover:bg-[var(--muted)] font-mono text-xs font-bold rounded-[2px] transition-all duration-150 flex items-center gap-1.5 cursor-pointer"
          >
            <span className="w-1.5 h-1.5 rounded-full status bg-[#0b7a43] inline-block animate-pulse" />
            <span>Generate Certificate</span>
          </button>
        </div>
      </div>

      <RightsCertificateModal
        isOpen={showCertModal}
        onClose={() => setShowCertModal(false)}
        commercialUse={value}
        campaignTitle="Retake Commercial Clearance"
        brandName="Brand Partner"
      />
    </>
  );
}

