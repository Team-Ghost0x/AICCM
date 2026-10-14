"use client";

import React, { useState, useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

const emptySubscribe = () => () => {};
import { Creator } from "@/lib/contract/schemas";
import { getCurrentUser, User } from "@/lib/client/auth";
import {
  sendCommunicationRequest,
  sendCreatorToClientPitch,
  getAllClients,
} from "@/lib/client/messages";
import { allPlatformCreators, indianClients, ClientProfile } from "@/lib/contract/fixtures";
import { playClickSound } from "@/lib/client/audio";
import { CloseIcon, CheckIcon, ArrowIcon } from "./icons";

interface CommunicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetCreator?: Creator | null;
  targetClient?: ClientProfile | null;
  onSuccess?: (threadId: string) => void;
}

export function CommunicationModal({
  isOpen,
  onClose,
  targetCreator: initialTargetCreator,
  targetClient: initialTargetClient,
  onSuccess,
}: CommunicationModalProps) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [currentUser] = useState<User | null>(() => getCurrentUser());
  const [selectedTargetType, setSelectedTargetType] = useState<"creator" | "client">(() => {
    return initialTargetClient ? "client" : "creator";
  });
  const [selectedCreatorId, setSelectedCreatorId] = useState<string>(() => {
    return initialTargetCreator?.id || allPlatformCreators[1]?.id || "";
  });
  const [selectedClientId, setSelectedClientId] = useState<string>(() => {
    return initialTargetClient?.id || indianClients[0]?.id || "";
  });

  const [projectTitle, setProjectTitle] = useState(() => {
    if (initialTargetCreator) return `Campaign Collaboration with @${initialTargetCreator.handle}`;
    if (initialTargetClient) return `Commercial AI Motion Pitch for ${initialTargetClient.brandName}`;
    return "Campaign Collaboration";
  });
  const [budgetInr, setBudgetInr] = useState<number>(() => {
    if (initialTargetCreator) return initialTargetCreator.priceFromInr || 45000;
    return 50000;
  });
  const [targetDeadline, setTargetDeadline] = useState("7 days");
  const [message, setMessage] = useState(() => {
    if (initialTargetCreator) {
      return `Hi ${initialTargetCreator.displayName.split(" ")[0]}, we loved your generative portfolio and process takes. We'd like to discuss commissioning you for an upcoming video campaign. Please let us know your timeline availability!`;
    }
    if (initialTargetClient) {
      return `Hi ${initialTargetClient.name.split(" ")[0]}, I reviewed ${initialTargetClient.brandName}'s creative campaign brief. I specialize in fast-turnaround generative cinema and ComfyUI workflows. Here is my proposal for your next campaign!`;
    }
    return "Hi, we are looking for a verified AI director for an upcoming brand campaign.";
  });
  const [includeTakeProof, setIncludeTakeProof] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const allClients = getAllClients();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const currentCreator = allPlatformCreators.find((c) => c.id === selectedCreatorId) || initialTargetCreator || allPlatformCreators[1];
  const currentClient = allClients.find((c) => c.id === selectedClientId) || initialTargetClient || allClients[0];

  const isPitchingClient = selectedTargetType === "client";
  const senderIsCreator = currentUser?.role === "creator";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !projectTitle.trim()) return;

    playClickSound();
    setIsSubmitting(true);

    const sender = currentUser || {
      id: senderIsCreator ? "creator-arjun" : "client-vikram",
      name: senderIsCreator ? "Arjun Patel" : "Vikram Sharma",
      email: senderIsCreator ? "arjun@retake.market" : "vikram.sharma@zomatostudios.com",
      company: senderIsCreator ? "Kinetic Motion AI Lab" : "Zomato Studios",
      role: senderIsCreator ? "creator" : "brand",
      balanceInr: 350000,
      credits: 24,
      provider: "google",
    };

    setTimeout(() => {
      let createdThreadId = "";

      if (isPitchingClient) {
        const takeAttachment = includeTakeProof
          ? {
              title: `Pitch Take: ${projectTitle}`,
              url: "/media/hero/take-4.jpg",
              takeNumber: 1,
              details: "Verified ComfyUI LoRA generation pass with 8K upscale",
            }
          : undefined;

        const { thread } = sendCreatorToClientPitch({
          fromCreatorUser: sender,
          toClient: currentClient,
          projectTitle,
          proposedBudgetInr: budgetInr,
          targetDeadline,
          message,
          takeAttachment,
        });
        createdThreadId = thread.id;
        setSuccessNotice(`Proposal Dispatched to ${currentClient.name} (${currentClient.company})!`);
      } else {
        const { thread } = sendCommunicationRequest({
          fromUser: sender,
          toCreator: currentCreator,
          projectTitle,
          proposedBudgetInr: budgetInr,
          targetDeadline,
          message,
        });
        createdThreadId = thread.id;
        setSuccessNotice(`Communication Request Dispatched to ${currentCreator.displayName}!`);
      }

      setIsSubmitting(false);

      setTimeout(() => {
        setSuccessNotice(null);
        onClose();
        onSuccess?.(createdThreadId);
      }, 900);
    }, 450);
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 transition-all"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-[var(--surface)] border border-[var(--border)] shadow-2xl backdrop-blur-2xl w-full max-w-xl p-6 sm:p-7 flex flex-col gap-5 text-left text-xs text-[var(--text)] rounded-2xl max-h-[90vh] overflow-y-auto relative animate-fadeIn">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--border)] pb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--link-aa)] inline-block" />
              <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-secondary-aa)] font-bold">
                Direct Communication &amp; Scope
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-[var(--text)] tracking-tight">
              {isPitchingClient ? "Pitch Proposal to Client / Brand" : "Request to Collaborate with Creator"}
            </h3>
            <p className="text-xs text-[var(--text-secondary-aa)] mt-0.5">
              {isPitchingClient
                ? "Initiate a direct production pitch, submit sample takes, and lock milestone escrow with brand executives."
                : "Commission verified AI creators with milestone escrow protection and telemetry proofs."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--text-secondary-aa)] hover:text-[var(--text)] p-1.5 rounded-lg hover:bg-[var(--surface-sunken)] cursor-pointer transition-colors"
            aria-label="Close modal"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Success State Notification */}
        {successNotice ? (
          <div className="bg-[var(--surface)] text-[var(--text)] p-8 rounded-xl flex flex-col items-center justify-center gap-3 text-center border border-emerald-500/50 shadow-lg">
            <span className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
              <CheckIcon size={28} strokeWidth={3} />
            </span>
            <strong className="text-lg font-bold text-[var(--text)]">{successNotice}</strong>
            <span className="text-xs text-[var(--text-secondary-aa)] font-mono">
              Live communication channel opened in messages. Redirecting...
            </span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Recipient Selector / Indicator */}
            {!initialTargetCreator && !initialTargetClient && (
              <div className="flex flex-col gap-1.5">
                <label className="block font-bold text-[var(--text)] uppercase font-mono text-[11px]">
                  Who do you want to communicate with?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setSelectedTargetType("creator");
                    }}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      selectedTargetType === "creator"
                        ? "bg-[var(--text)] text-[var(--bg)] border-[var(--text)] shadow-xs"
                        : "bg-[var(--surface)] text-[var(--text-secondary-aa)] border-[var(--border)] hover:text-[var(--text)]"
                    }`}
                  >
                    AI Creator (Director)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setSelectedTargetType("client");
                    }}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      selectedTargetType === "client"
                        ? "bg-[var(--text)] text-[var(--bg)] border-[var(--text)] shadow-xs"
                        : "bg-[var(--surface)] text-[var(--text-secondary-aa)] border-[var(--border)] hover:text-[var(--text)]"
                    }`}
                  >
                    Enterprise Brand (Client)
                  </button>
                </div>
              </div>
            )}

            {/* Target Card */}
            {isPitchingClient ? (
              <div className="bg-[var(--surface-sunken)] p-3.5 rounded-xl border border-[var(--border)] flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary-aa)] font-bold">
                    Target Enterprise Client
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    Active Client Brief
                  </span>
                </div>
                {!initialTargetClient ? (
                  <select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg p-2 text-xs font-semibold text-[var(--text)] focus:outline-none focus:border-[var(--text)]"
                  >
                    {allClients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name} — {client.brandName} ({client.location})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div>
                    <strong className="text-sm text-[var(--text)] block">{currentClient.name}</strong>
                    <span className="text-xs text-[var(--text-secondary-aa)]">
                      {currentClient.title} @ {currentClient.company}
                    </span>
                    <div className="text-[10px] text-[var(--text-secondary-aa)] mt-1 font-mono">
                      Location: {currentClient.location} · {currentClient.activeBriefsCount} Active Briefs
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-[var(--surface-sunken)] p-3.5 rounded-xl border border-[var(--border)] flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary-aa)] font-bold">
                    Target AI Creator
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    From ₹{currentCreator.priceFromInr.toLocaleString("en-IN")}
                  </span>
                </div>
                {!initialTargetCreator ? (
                  <select
                    value={selectedCreatorId}
                    onChange={(e) => setSelectedCreatorId(e.target.value)}
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg p-2 text-xs font-semibold text-[var(--text)] focus:outline-none focus:border-[var(--text)]"
                  >
                    {allPlatformCreators.map((creator) => (
                      <option key={creator.id} value={creator.id}>
                        {creator.displayName} (@{creator.handle}) — {creator.location}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div>
                    <strong className="text-sm text-[var(--text)] block">{currentCreator.displayName}</strong>
                    <span className="text-xs text-[var(--text-secondary-aa)]">{currentCreator.headline}</span>
                    <div className="text-[10px] text-[var(--text-secondary-aa)] mt-1 font-mono">
                      Location: {currentCreator.location} · Turnaround: {currentCreator.turnaroundDays}d
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Project Title */}
            <div>
              <label htmlFor="comm-title" className="block font-bold text-[var(--text)] uppercase font-mono text-[11px] mb-1">
                Project / Campaign Title
              </label>
              <input
                id="comm-title"
                type="text"
                required
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="e.g. Midnight Sizzle 15s Kinetic Social Video"
                className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--text)] transition-colors"
              />
            </div>

            {/* Budget & Target Delivery */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="comm-budget" className="block font-bold text-[var(--text)] uppercase font-mono text-[11px] mb-1">
                  {isPitchingClient ? "Proposed Rate (₹ INR)" : "Proposed Budget (₹ INR)"}
                </label>
                <input
                  id="comm-budget"
                  type="number"
                  min={1000}
                  step={5000}
                  value={budgetInr}
                  onChange={(e) => setBudgetInr(Number(e.target.value))}
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs font-mono text-[var(--text)] focus:outline-none focus:border-[var(--text)] transition-colors"
                />
              </div>
              <div>
                <label htmlFor="comm-deadline" className="block font-bold text-[var(--text)] uppercase font-mono text-[11px] mb-1">
                  Target Delivery Date
                </label>
                <input
                  id="comm-deadline"
                  type="date"
                  value={targetDeadline}
                  onChange={(e) => setTargetDeadline(e.target.value)}
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs font-mono text-[var(--text)] focus:outline-none focus:border-[var(--text)] transition-colors"
                />
              </div>
            </div>

            {/* Creator Pitch Attachment Option */}
            {isPitchingClient && (
              <div className="bg-[var(--surface-sunken)] p-3 rounded-xl border border-[var(--border)] flex items-center justify-between">
                <div>
                  <strong className="text-xs text-[var(--text)] block font-bold">Attach Process Take Proof</strong>
                  <span className="text-[11px] text-[var(--text-secondary-aa)]">
                    Includes verified 8K upscale take + ComfyUI telemetry with initial message.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={includeTakeProof}
                  onChange={(e) => setIncludeTakeProof(e.target.checked)}
                  className="w-4 h-4 cursor-pointer accent-[var(--text)] rounded"
                />
              </div>
            )}

            {/* Custom Message Pitch */}
            <div>
              <label htmlFor="comm-msg" className="block font-bold text-[var(--text)] uppercase font-mono text-[11px] mb-1">
                {isPitchingClient ? "Concept Pitch & Methodology" : "Creative Brief & Inquiries"}
              </label>
              <textarea
                id="comm-msg"
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  isPitchingClient
                    ? "Explain your vision for this brief, camera motion, prompt strategy, and turnaround..."
                    : "Describe creative requirements, aspect ratio, preferred AI tools (Runway, Kling, ComfyUI)..."
                }
                className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg p-3 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--text)] transition-colors resize-none"
              />
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={onClose}
                className="bg-[var(--surface)] hover:bg-[var(--surface-sunken)] text-[var(--text)] font-semibold px-4 py-2 rounded-lg border border-[var(--border)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-[var(--text)] hover:opacity-90 text-[var(--bg)] font-bold px-6 py-2.5 rounded-lg shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                <span>{isSubmitting ? "Dispatching..." : isPitchingClient ? "Submit Pitch" : "Send Request"}</span>
                <ArrowIcon size={14} />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

