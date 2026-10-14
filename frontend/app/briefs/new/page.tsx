"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Brief, AspectRatio, ContentType } from "@/lib/contract/schemas";
import { createBriefDraft, saveBrief } from "@/lib/client/api";
import { AspectRatioPicker } from "@/components/aspect-ratio-picker";
import { RightsMatrix } from "@/components/rights-matrix";
import { CallSheet } from "@/components/call-sheet";
import { playClickSound } from "@/lib/client/audio";
import { getCurrentUser, onAuthChange, User } from "@/lib/client/auth";
import { AuthModal } from "@/components/auth-modal";
import { LockIcon, OrdersIcon } from "@/components/icons";

function NewBriefContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invitedHandle = searchParams.get("invited");

  const [user, setUser] = useState<User | null>(() => getCurrentUser());
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const unsub = onAuthChange((u) => setUser(u));
    return () => unsub();
  }, []);

  const [ideaText, setIdeaText] = useState("");
  const [isDrafting, setIsDrafting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [gapFields, setGapFields] = useState<string[]>([]);

  // Brief state
  const [brief, setBrief] = useState<Partial<Brief>>(() => ({
    brandName: user?.company || user?.name || "",
    title: invitedHandle ? `Project with @${invitedHandle}` : "",
    objective: "",
    requirements: "",
    contentType: "video",
    styleTags: [],
    referenceUrls: [],
    formats: [{ aspectRatio: "9:16", durationSec: 15 }],
    deliverablesCount: 3,
    preferredTools: ["runway"],
    budgetInr: { min: 20000, max: 40000 },
    deadline: "",
    commercialUse: {
      uses: ["paid_social", "organic_social"],
      territory: "india",
      termMonths: 12,
      exclusivity: "none",
      rightsTransfer: "license",
      aiDisclosure: "must_label",
      noModelTraining: true,
    },
  }));

  const handleBuildFromIdea = async () => {
    if (!ideaText.trim()) return;
    setIsDrafting(true);
    setErrorMessage(null);
    playClickSound();

    try {
      const draftResult = await createBriefDraft(ideaText);
      setBrief((prev) => ({
        ...prev,
        ...draftResult.brief,
      }));
      setGapFields(draftResult.gaps.map((g) => g.field));
    } catch {
      // Graceful fallback
    } finally {
      setIsDrafting(false);
    }
  };

  const handlePublish = async () => {
    setErrorMessage(null);
    playClickSound();

    if (!user) {
      setErrorMessage("Authentication required. Please sign in as a Brand to post a brief.");
      setShowAuthModal(true);
      return;
    }

    if (user.role === "creator") {
      setErrorMessage("Creators cannot publish briefs. Please switch to or register a Brand account.");
      return;
    }

    // Validate budget consistency
    if (
      brief.budgetInr &&
      brief.budgetInr.min > 0 &&
      brief.budgetInr.max > 0 &&
      brief.budgetInr.max < brief.budgetInr.min
    ) {
      setErrorMessage("Budget max is lower than min. Raise the max or lower the min.");
      return;
    }

    setIsPublishing(true);

    const generatedId = "brief-" + Date.now().toString(36);
    const completeBrief: Brief = {
      id: generatedId,
      brandName: brief.brandName?.trim() || user.company || user.name || "Brand Studio",
      title: brief.title?.trim() || "Creative Campaign Brief",
      objective: brief.objective?.trim() || "Launch campaign deliverables.",
      requirements:
        brief.requirements?.trim() ||
        ideaText ||
        "High-quality generative production deliverables.",
      contentType: brief.contentType || "video",
      styleTags:
        brief.styleTags && brief.styleTags.length > 0
          ? brief.styleTags
          : ["premium"],
      referenceUrls: brief.referenceUrls || [],
      formats:
        brief.formats && brief.formats.length > 0
          ? brief.formats
          : [{ aspectRatio: "9:16", durationSec: 15 }],
      deliverablesCount: brief.deliverablesCount || 3,
      preferredTools:
        brief.preferredTools && brief.preferredTools.length > 0
          ? brief.preferredTools
          : ["runway"],
      budgetInr: brief.budgetInr || { min: 20000, max: 40000 },
      deadline:
        brief.deadline || new Date(Date.now() + 7 * 86400000).toISOString(),
      commercialUse: brief.commercialUse || {
        uses: ["paid_social", "organic_social"],
        territory: "india",
        termMonths: 12,
        exclusivity: "none",
        rightsTransfer: "license",
        aiDisclosure: "must_label",
        noModelTraining: true,
      },
      status: "open",
      createdAt: new Date().toISOString(),
    };

    try {
      const saved = await saveBrief(completeBrief);
      setTimeout(() => {
        router.push(`/briefs/${saved.id}`);
      }, 300);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to publish brief to backend.";
      setErrorMessage(message);
      setIsPublishing(false);
    }
  };

  const currentRatios: AspectRatio[] =
    brief.formats?.map((f) => f.aspectRatio) || [];

  const handleRatiosChange = (ratios: AspectRatio[]) => {
    setBrief({
      ...brief,
      formats: ratios.map((r) => ({ aspectRatio: r, durationSec: 15 })),
    });
  };

  // Guard 1: Not logged in
  if (!user) {
    return (
      <div className="max-w-[700px] mx-auto px-4 py-16 text-center select-none">
        <div className="w-16 h-16 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mx-auto mb-6 shadow-sm">
          <LockIcon size={28} className="text-[var(--link-aa)]" />
        </div>
        <span className="text-xs font-mono uppercase tracking-widest text-[var(--link-aa)] font-bold">
          Brand Authentication Required
        </span>
        <h1 className="text-3xl font-black text-[var(--text)] tracking-tight mt-2 mb-3">
          Sign In as a Brand to Post a Brief
        </h1>
        <p className="text-sm text-[var(--text-secondary-aa)] max-w-md mx-auto mb-8 leading-relaxed">
          Posting commercial generative briefs, scoping AI production budgets, and hiring verified creators requires an authenticated Brand or Agency account.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              playClickSound();
              setShowAuthModal(true);
            }}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[var(--link-aa)] hover:bg-[var(--link-aa-hover)] text-white font-bold text-sm transition-all shadow-sm cursor-pointer"
          >
            Sign In as Brand
          </button>
          <Link
            href="/briefs"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] font-semibold text-sm transition-all"
          >
            Browse Active Briefs
          </Link>
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

  // Guard 2: Creator account trying to post brief
  if (user.role === "creator") {
    return (
      <div className="max-w-[700px] mx-auto px-4 py-16 text-center select-none">
        <div className="w-16 h-16 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mx-auto mb-6 shadow-sm">
          <OrdersIcon size={28} className="text-[var(--text-secondary-aa)]" />
        </div>
        <span className="text-xs font-mono uppercase tracking-widest text-[var(--text-secondary-aa)] font-bold">
          Brand &amp; Agency Feature
        </span>
        <h1 className="text-3xl font-black text-[var(--text)] tracking-tight mt-2 mb-3">
          Creators Cannot Post Campaign Briefs
        </h1>
        <p className="text-sm text-[var(--text-secondary-aa)] max-w-md mx-auto mb-8 leading-relaxed">
          Your account is registered as an AI Creator (<strong>{user.name}</strong>). Brief creation is reserved for Brands and Creative Agencies. As a creator, you can browse open opportunities and pitch your verified workflows.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/briefs"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[var(--link-aa)] text-white font-bold text-sm shadow-sm"
          >
            Browse Open Briefs
          </Link>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] font-semibold text-sm"
          >
            Go to Creator Studio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 md:px-12 py-8 md:py-12 text-left">
      {/* Page Title */}
      <div className="border-b border-[var(--border)] pb-4 mb-8">
        <span className="text-xs font-mono uppercase tracking-widest text-[var(--text-secondary-aa)] block">
          Creative Brief Definition
        </span>
        <h1 className="text-3xl md:text-4xl font-black text-[var(--text)] tracking-tight mt-1">
          Post a Brief
        </h1>
      </div>

      {/* Invited Creator Callout Banner */}
      {invitedHandle && (
        <div className="mb-6 p-4 bg-[var(--surface)] border border-[var(--border)] border-l-4 border-l-[var(--link-aa)] rounded-xl text-xs font-medium text-[var(--text)] flex items-center justify-between shadow-xs">
          <div>
            <span className="font-bold uppercase tracking-wider block font-mono text-[11px] text-[var(--link-aa)]">
              Direct Creator Invitation
            </span>
            <span>
              You are scoping this brief directly for <strong>@{invitedHandle}</strong>. Matches and rankings will highlight direct fit.
            </span>
          </div>
          <span className="text-xs font-bold text-[var(--text)] px-2.5 py-1 bg-[var(--bg)] border border-[var(--border)] rounded-full">
            Invited
          </span>
        </div>
      )}

      {/* Error Message Toast/Banner */}
      {errorMessage && (
        <div className="mb-6 p-4 bg-[var(--surface)] border border-[var(--border)] border-l-4 border-l-[var(--danger-aa)] text-xs font-bold text-[var(--danger-aa)] rounded-xl shadow-xs">
          {errorMessage}
        </div>
      )}

      {/* Start with Rough Idea Box */}
      <section className="bg-[var(--surface)] p-6 border border-[var(--border)] rounded-2xl mb-10 shadow-xs">
        <label
          htmlFor="idea-input"
          className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary-aa)] mb-2"
        >
          Describe the idea in a sentence (AI Assistant will structure the fields)
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <textarea
            id="idea-input"
            rows={2}
            value={ideaText}
            onChange={(e) => setIdeaText(e.target.value)}
            placeholder="Three cinematic 8K teaser reels for our upcoming cyberpunk feature film, IMAX aesthetic"
            className="flex-1 bg-[var(--bg)] border border-[var(--border)] p-3 text-xs leading-relaxed rounded-lg text-[var(--text)] focus:outline-none focus:border-[var(--link-aa)] focus:ring-1 focus:ring-[var(--link-aa)] transition-colors"
          />
          <button
            type="button"
            onClick={handleBuildFromIdea}
            disabled={isDrafting}
            className="bg-[var(--text)] text-[var(--surface)] hover:opacity-90 font-bold text-xs px-6 py-3 rounded-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center flex-shrink-0 shadow-xs select-none"
          >
            {isDrafting ? "Structuring brief..." : "Build my brief"}
          </button>
        </div>
      </section>

      {/* Two Column Layout: Left Form, Right Call Sheet */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          {/* Campaign Overview */}
          <div className="bg-[var(--surface)] p-6 border border-[var(--border)] rounded-2xl flex flex-col gap-4 shadow-xs">
            <h2 className="text-lg font-bold text-[var(--text)] border-b border-[var(--border)] pb-3">
              Campaign Information
            </h2>

            <div>
              <label
                htmlFor="brand-name"
                className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary-aa)] mb-1"
              >
                Brand or Studio Name
              </label>
              <input
                id="brand-name"
                type="text"
                value={brief.brandName || ""}
                onChange={(e) =>
                  setBrief({ ...brief, brandName: e.target.value })
                }
                placeholder="e.g. Stride Studio"
                className="w-full bg-[var(--bg)] border border-[var(--border)] text-xs text-[var(--text)] p-2.5 rounded-lg focus:outline-none focus:border-[var(--link-aa)] focus:ring-1 focus:ring-[var(--link-aa)]"
              />
            </div>

            <div>
              <label
                htmlFor="brief-title"
                className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary-aa)] mb-1"
              >
                Campaign Title
              </label>
              <input
                id="brief-title"
                type="text"
                value={brief.title || ""}
                onChange={(e) => setBrief({ ...brief, title: e.target.value })}
                placeholder="e.g. NEO-SHINJUKU 2099 Cyberpunk Teaser"
                className="w-full bg-[var(--bg)] border border-[var(--border)] text-xs text-[var(--text)] p-2.5 rounded-lg focus:outline-none focus:border-[var(--link-aa)] focus:ring-1 focus:ring-[var(--link-aa)]"
              />
            </div>

            <div>
              <label
                htmlFor="brief-objective"
                className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary-aa)] mb-1"
              >
                Campaign Objective
              </label>
              <textarea
                id="brief-objective"
                rows={2}
                value={brief.objective || ""}
                onChange={(e) =>
                  setBrief({ ...brief, objective: e.target.value })
                }
                placeholder="e.g. Launch our futuristic sci-fi feature film campaign with three 8K volumetric teaser reels."
                className="w-full bg-[var(--bg)] border border-[var(--border)] text-xs text-[var(--text)] p-2.5 rounded-lg focus:outline-none focus:border-[var(--link-aa)] focus:ring-1 focus:ring-[var(--link-aa)]"
              />
            </div>

            <div>
              <label
                htmlFor="brief-reqs"
                className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary-aa)] mb-1"
              >
                Creative Requirements &amp; Constraints
              </label>
              <textarea
                id="brief-reqs"
                rows={3}
                value={brief.requirements || ""}
                onChange={(e) =>
                  setBrief({ ...brief, requirements: e.target.value })
                }
                placeholder="Three films of 15 to 20 seconds. Cyberpunk megalopolis, torrential rain, android Unit-07 in every shot. No generic AI artifacts."
                className="w-full bg-[var(--bg)] border border-[var(--border)] text-xs text-[var(--text)] p-2.5 rounded-lg focus:outline-none focus:border-[var(--link-aa)] focus:ring-1 focus:ring-[var(--link-aa)]"
              />
            </div>
          </div>

          {/* Formats & Content Type */}
          <div className="bg-[var(--surface)] p-6 border border-[var(--border)] rounded-2xl flex flex-col gap-5 shadow-xs">
            <h2 className="text-lg font-bold text-[var(--text)] border-b border-[var(--border)] pb-3">
              Deliverables &amp; Format
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="content-type-select"
                  className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary-aa)] mb-1"
                >
                  Content Type
                </label>
                <select
                  id="content-type-select"
                  value={brief.contentType || "video"}
                  onChange={(e) =>
                    setBrief({
                      ...brief,
                      contentType: e.target.value as ContentType,
                    })
                  }
                  className="w-full bg-[var(--bg)] border border-[var(--border)] text-xs text-[var(--text)] p-2.5 rounded-lg focus:outline-none focus:border-[var(--link-aa)]"
                >
                  <option value="video">Video</option>
                  <option value="animation">Animation</option>
                  <option value="still">Still / Key Art</option>
                  <option value="mixed">Mixed Media</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="deliverables-count"
                  className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary-aa)] mb-1"
                >
                  Deliverables Count
                </label>
                <input
                  id="deliverables-count"
                  type="number"
                  min={1}
                  max={20}
                  value={brief.deliverablesCount || 3}
                  onChange={(e) =>
                    setBrief({
                      ...brief,
                      deliverablesCount: Number(e.target.value),
                    })
                  }
                  className="w-full bg-[var(--bg)] border border-[var(--border)] text-xs text-[var(--text)] p-2.5 rounded-lg tabular-numbers focus:outline-none focus:border-[var(--link-aa)]"
                />
              </div>
            </div>

            {/* Scale Aspect Ratio Picker */}
            <AspectRatioPicker
              selected={currentRatios}
              onChange={handleRatiosChange}
            />
          </div>

          {/* Budget, Deadline, Tools */}
          <div className="bg-[var(--surface)] p-6 border border-[var(--border)] rounded-2xl flex flex-col gap-4 shadow-xs">
            <h2 className="text-lg font-bold text-[var(--text)] border-b border-[var(--border)] pb-3">
              Budget, Tools &amp; Timeline
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="budget-min"
                  className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary-aa)] mb-1"
                >
                  Budget Min (₹)
                </label>
                <input
                  id="budget-min"
                  type="number"
                  value={brief.budgetInr?.min || 20000}
                  onChange={(e) =>
                    setBrief({
                      ...brief,
                      budgetInr: {
                        min: Number(e.target.value),
                        max: brief.budgetInr?.max || 40000,
                      },
                    })
                  }
                  className="w-full bg-[var(--bg)] border border-[var(--border)] text-xs text-[var(--text)] p-2.5 rounded-lg tabular-numbers focus:outline-none focus:border-[var(--link-aa)]"
                />
              </div>

              <div>
                <label
                  htmlFor="budget-max"
                  className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary-aa)] mb-1"
                >
                  Budget Max (₹)
                </label>
                <input
                  id="budget-max"
                  type="number"
                  value={brief.budgetInr?.max || 40000}
                  onChange={(e) =>
                    setBrief({
                      ...brief,
                      budgetInr: {
                        min: brief.budgetInr?.min || 20000,
                        max: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full bg-[var(--bg)] border border-[var(--border)] text-xs text-[var(--text)] p-2.5 rounded-lg tabular-numbers focus:outline-none focus:border-[var(--link-aa)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="deadline-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary-aa)] mb-1"
                >
                  Delivery Deadline
                </label>
                <input
                  id="deadline-input"
                  type="date"
                  value={brief.deadline?.split("T")[0] || ""}
                  onChange={(e) =>
                    setBrief({
                      ...brief,
                      deadline: new Date(e.target.value).toISOString(),
                    })
                  }
                  className="w-full bg-[var(--bg)] border border-[var(--border)] text-xs text-[var(--text)] p-2.5 rounded-lg focus:outline-none focus:border-[var(--link-aa)]"
                />
              </div>

              <div>
                <label
                  htmlFor="preferred-tools"
                  className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary-aa)] mb-1"
                >
                  Preferred Tools
                </label>
                <input
                  id="preferred-tools"
                  type="text"
                  value={brief.preferredTools?.join(", ") || ""}
                  onChange={(e) =>
                    setBrief({
                      ...brief,
                      preferredTools: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="e.g. runway, kling"
                  className="w-full bg-[var(--bg)] border border-[var(--border)] text-xs text-[var(--text)] p-2.5 rounded-lg focus:outline-none focus:border-[var(--link-aa)]"
                />
              </div>
            </div>
          </div>

          {/* Commercial Rights Matrix */}
          {brief.commercialUse && (
            <RightsMatrix
              value={brief.commercialUse}
              onChange={(updated) =>
                setBrief({ ...brief, commercialUse: updated })
              }
            />
          )}
        </div>

        {/* Right Sticky Call Sheet Preview (5 cols) */}
        <div className="lg:col-span-5 lg:sticky lg:top-20">
          <CallSheet
            brief={brief}
            gapFields={gapFields}
            onPublish={handlePublish}
            isPublishing={isPublishing}
          />
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

export default function NewBriefPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-[1360px] mx-auto px-6 py-12 text-left text-sm text-[var(--text-secondary-aa)]">
          Loading brief builder...
        </div>
      }
    >
      <NewBriefContent />
    </Suspense>
  );
}
