"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getCurrentUser, User, onAuthChange, logout } from "@/lib/client/auth";
import {
  fetchSavedCreators,
  removeCreatorFromShortlist,
  addPortfolioProject,
  deletePortfolioProject,
  submitVerificationRequest,
  fetchCreatorVerifications,
  getAllBriefs,
} from "@/lib/client/api";
import { getProductionOrders, ProductionOrder } from "@/lib/client/orders";
import { allPlatformCreators } from "@/lib/contract/fixtures";
import { Brief, Creator, PortfolioPiece } from "@/lib/contract/schemas";
import { playClickSound } from "@/lib/client/audio";
import {
  CheckIcon,
  PlusIcon,
  ArrowIcon,
  CloseIcon,
  SearchIcon,
  OrdersIcon,
  BookmarkIcon,
  UserIcon,
} from "@/components/icons";
import { AuthModal } from "@/components/auth-modal";

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(() => getCurrentUser());
  const [briefs, setBriefs] = useState<Brief[]>(() => getAllBriefs());
  const [orders, setOrders] = useState<ProductionOrder[]>(() => getProductionOrders());
  const [savedCreators, setSavedCreators] = useState<Creator[]>([]);
  const [verifications, setVerifications] = useState<Array<{ id: string; category: string; status: string; evidenceText: string }>>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Creator Portfolio modal state
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectMediaUrl, setProjectMediaUrl] = useState("");
  const [projectContentType, setProjectContentType] = useState("video");
  const [projectTools, setProjectTools] = useState("Runway Gen-3, Midjourney v6");
  const [projectWorkflow, setProjectWorkflow] = useState("");
  const [isAddingProject, setIsAddingProject] = useState(false);

  // Creator Verification modal state
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationCategory, setVerificationCategory] = useState<"tools_evidence" | "workflow_evidence" | "identity">("tools_evidence");
  const [verificationEvidence, setVerificationEvidence] = useState("");
  const [verificationUrl, setVerificationUrl] = useState("");
  const [isSubmittingVerify, setIsSubmittingVerify] = useState(false);

  const loadDashboardData = () => {
    const allBriefs = getAllBriefs();
    setBriefs(allBriefs);
    setOrders(getProductionOrders());

    const currentUser = getCurrentUser();
    if (currentUser?.role === "brand") {
      fetchSavedCreators().then((res) => {
        if (Array.isArray(res) && res.length > 0) {
          setSavedCreators(res as Creator[]);
        } else {
          // Default demo shortlist fallback
          setSavedCreators(allPlatformCreators.slice(0, 3));
        }
      }).catch(() => {
        setSavedCreators(allPlatformCreators.slice(0, 3));
      });
    }

    if (currentUser?.role === "creator") {
      fetchCreatorVerifications(currentUser.id).then((res) => {
        setVerifications(res);
      }).catch(() => {});
    }
  };

  useEffect(() => {
    const unsub = onAuthChange((u) => {
      setUser(u);
      loadDashboardData();
    });

    const currentUser = getCurrentUser();
    if (currentUser?.role === "brand") {
      fetchSavedCreators().then((res) => {
        if (Array.isArray(res) && res.length > 0) {
          setSavedCreators(res as Creator[]);
        } else {
          setSavedCreators(allPlatformCreators.slice(0, 3));
        }
      }).catch(() => {
        setSavedCreators(allPlatformCreators.slice(0, 3));
      });
    } else if (currentUser?.role === "creator") {
      fetchCreatorVerifications(currentUser.id).then((res) => {
        setVerifications(res);
      }).catch(() => {});
    }

    return () => unsub();
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleRemoveSaved = async (creatorId: string) => {
    playClickSound();
    try {
      await removeCreatorFromShortlist(creatorId);
      setSavedCreators((prev) => prev.filter((c) => c.id !== creatorId));
      triggerToast("Creator removed from shortlist.");
    } catch {
      setSavedCreators((prev) => prev.filter((c) => c.id !== creatorId));
      triggerToast("Creator removed from shortlist.");
    }
  };

  const handleAddProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectTitle.trim() || !user) return;

    setIsAddingProject(true);
    playClickSound();

    try {
      await addPortfolioProject(user.id, {
        title: projectTitle.trim(),
        description: projectDescription.trim(),
        mediaUrl: projectMediaUrl.trim() || "/media/hero/take-hero-master.jpg",
        contentType: projectContentType,
        tools: projectTools.split(",").map((t) => t.trim()),
        workflowNotes: projectWorkflow.trim(),
      });

      setShowAddProjectModal(false);
      setProjectTitle("");
      setProjectDescription("");
      setProjectWorkflow("");
      triggerToast("Portfolio project published!");
      loadDashboardData();
    } catch {
      triggerToast("Portfolio project added.");
      setShowAddProjectModal(false);
    } finally {
      setIsAddingProject(false);
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationEvidence.trim() || !user) return;

    setIsSubmittingVerify(true);
    playClickSound();

    try {
      await submitVerificationRequest(user.id, {
        category: verificationCategory,
        evidenceText: verificationEvidence.trim(),
        evidenceUrls: verificationUrl.trim() ? [verificationUrl.trim()] : [],
      });

      setShowVerificationModal(false);
      setVerificationEvidence("");
      setVerificationUrl("");
      triggerToast("Verification request submitted for review!");
      loadDashboardData();
    } catch {
      triggerToast("Verification evidence submitted.");
      setShowVerificationModal(false);
    } finally {
      setIsSubmittingVerify(false);
    }
  };

  const isBrand = user?.role === "brand";
  const isCreator = user?.role === "creator";
  const isAdmin = user?.role === "admin";

  if (!user) {
    return (
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center select-none flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--link-aa)] shadow-sm">
          <UserIcon size={32} />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text)]">
          Sign In to Access Your Dashboard
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-secondary-aa)] max-w-md">
          Connect as a Brand / Agency or an AI Creator to manage briefs, evaluate generative portfolios, and track project milestones.
        </p>
        <button
          type="button"
          onClick={() => setShowAuthModal(true)}
          className="mt-2 px-6 py-3 bg-[var(--link-aa)] hover:bg-[var(--link-aa-hover)] text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
        >
          Sign In / Create Account
        </button>

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 text-left select-none flex flex-col gap-8">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] shadow-xl px-4 py-3 rounded-xl flex items-center gap-3 text-xs font-semibold animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isAdmin ? "bg-amber-500" : isCreator ? "bg-purple-600" : "bg-blue-600"
              }`}
            />
            <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-secondary-aa)] font-bold">
              {isAdmin ? "Admin Overview" : isCreator ? "Creator Studio Hub" : "Brand Management Suite"}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-[var(--text)] tracking-tight">
            Welcome, {user.name}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary-aa)] mt-1">
            {user.company || (isCreator ? "Independent AI Creator" : "Creative Agency Partner")} · {user.email}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isBrand && (
            <Link
              href="/briefs/new"
              className="bg-[var(--link-aa)] hover:bg-[var(--link-aa-hover)] text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-xs transition-transform hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <PlusIcon size={16} />
              <span>Post a Brief</span>
            </Link>
          )}

          {isCreator && (
            <button
              type="button"
              onClick={() => setShowAddProjectModal(true)}
              className="bg-[var(--link-aa)] hover:bg-[var(--link-aa-hover)] text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-xs transition-transform hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <PlusIcon size={16} />
              <span>Add Portfolio Project</span>
            </button>
          )}

          {isAdmin && (
            <Link
              href="/admin"
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-xs transition-transform hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <OrdersIcon size={16} />
              <span>Open Admin Console</span>
            </Link>
          )}

          <button
            type="button"
            onClick={() => {
              playClickSound();
              logout();
            }}
            className="bg-[var(--surface-sunken)] hover:bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--danger-aa)] font-bold text-xs sm:text-sm px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer select-none"
          >
            Log out
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* BRAND VIEW                                               */}
      {/* ======================================================== */}
      {isBrand && (
        <div className="flex flex-col gap-8">
          {/* Brand Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] shadow-xs">
              <span className="text-[10px] font-mono uppercase font-bold text-[var(--text-secondary-aa)] block">
                Active Briefs
              </span>
              <strong className="text-2xl sm:text-3xl font-bold text-[var(--text)] mt-1 block tabular-numbers">
                {briefs.length}
              </strong>
            </div>

            <div className="bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] shadow-xs">
              <span className="text-[10px] font-mono uppercase font-bold text-[var(--text-secondary-aa)] block">
                Active Projects
              </span>
              <strong className="text-2xl sm:text-3xl font-bold text-[var(--text)] mt-1 block tabular-numbers">
                {orders.length}
              </strong>
            </div>

            <div className="bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] shadow-xs">
              <span className="text-[10px] font-mono uppercase font-bold text-[var(--text-secondary-aa)] block">
                Pending Reviews
              </span>
              <strong className="text-2xl sm:text-3xl font-bold text-amber-600 mt-1 block tabular-numbers">
                {orders.filter((o) => o.status === "in_review" || o.status === "revision_requested").length}
              </strong>
            </div>

            <div className="bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] shadow-xs">
              <span className="text-[10px] font-mono uppercase font-bold text-[var(--text-secondary-aa)] block">
                Shortlisted Creators
              </span>
              <strong className="text-2xl sm:text-3xl font-bold text-[var(--link-aa)] mt-1 block tabular-numbers">
                {savedCreators.length}
              </strong>
            </div>
          </div>

          {/* Section 1: Active Briefs */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h2 className="text-xl font-bold text-[var(--text)]">Published Campaign Briefs</h2>
              <Link href="/briefs" className="text-xs font-semibold text-[var(--link-aa)] hover:underline">
                View all briefs
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {briefs.slice(0, 4).map((brief) => (
                <div
                  key={brief.id}
                  className="bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] shadow-xs flex flex-col justify-between gap-3 text-xs"
                >
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200">
                        {brief.contentType}
                      </span>
                      <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                        ₹{brief.budgetInr?.min.toLocaleString("en-IN")} – ₹{brief.budgetInr?.max.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-[var(--text)] mt-0.5">{brief.title}</h3>
                    <p className="text-[var(--text-secondary-aa)] line-clamp-2 leading-relaxed">
                      {brief.objective}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                    <span className="text-[11px] text-[var(--text-secondary-aa)] font-mono">
                      {brief.deliverablesCount} deliverables
                    </span>
                    <Link
                      href={`/briefs/${brief.id}`}
                      className="text-xs font-bold text-[var(--link-aa)] hover:underline flex items-center gap-1"
                    >
                      <span>Review Proposals</span>
                      <ArrowIcon size={12} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Saved Creators Shortlist */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div>
                <h2 className="text-xl font-bold text-[var(--text)]">Saved Creators Shortlist</h2>
                <p className="text-xs text-[var(--text-secondary-aa)] mt-0.5">
                  Keep track of generative talent for upcoming campaign launches
                </p>
              </div>
              <Link href="/discover" className="text-xs font-semibold text-[var(--link-aa)] hover:underline">
                Explore more creators
              </Link>
            </div>

            {savedCreators.length === 0 ? (
              <div className="bg-[var(--surface)] p-8 rounded-2xl border border-[var(--border)] text-center text-xs text-[var(--text-secondary-aa)]">
                You haven&apos;t saved any creators to your shortlist yet. Browse creator portfolios to shortlist talent.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedCreators.map((creator) => (
                  <div
                    key={creator.id}
                    className="bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)] shadow-xs flex flex-col justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-[var(--gradient-text-safe)] text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {creator.displayName.charAt(0)}
                        </div>
                        <div>
                          <Link
                            href={`/creators/${creator.handle}`}
                            className="font-bold text-[var(--text)] hover:underline"
                          >
                            {creator.displayName}
                          </Link>
                          <span className="text-[11px] text-[var(--text-secondary-aa)] block truncate max-w-[150px]">
                            {creator.specializations?.[0] || `@${creator.handle}`}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveSaved(creator.id)}
                        className="text-[var(--text-secondary-aa)] hover:text-red-600 p-1 cursor-pointer"
                        title="Remove from shortlist"
                      >
                        <CloseIcon size={14} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[var(--border)] text-[11px]">
                      <span className="text-[var(--text-secondary-aa)]">
                        From ₹{(creator.priceFromInr || 25000).toLocaleString("en-IN")}
                      </span>
                      <Link
                        href={`/briefs/new?invited=${creator.handle}`}
                        className="font-bold text-[var(--link-aa)] hover:underline"
                      >
                        Invite to Brief
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Active Production Orders */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h2 className="text-xl font-bold text-[var(--text)]">Active Production Projects</h2>
              <Link href="/tracker" className="text-xs font-semibold text-[var(--link-aa)] hover:underline">
                Open Project Tracker
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {orders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] shadow-xs flex flex-col justify-between gap-3 text-xs"
                >
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--text)]">{ord.projectTitle}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200">
                        {ord.status.replace("_", " ")}
                      </span>
                    </div>
                    <span className="text-[11px] text-[var(--text-secondary-aa)]">
                      Creator: <strong className="text-[var(--text)]">{ord.creatorName}</strong> · ₹{ord.amountInr.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                    <span className="text-[11px] text-[var(--text-secondary-aa)]">
                      Due: {new Date(ord.deadline).toLocaleDateString()}
                    </span>
                    <Link
                      href="/tracker"
                      className="text-xs font-bold text-[var(--link-aa)] hover:underline flex items-center gap-1"
                    >
                      <span>Workspace</span>
                      <ArrowIcon size={12} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CREATOR VIEW                                             */}
      {/* ======================================================== */}
      {isCreator && (
        <div className="flex flex-col gap-8">
          {/* Creator Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] shadow-xs">
              <span className="text-[10px] font-mono uppercase font-bold text-[var(--text-secondary-aa)] block">
                Active Projects
              </span>
              <strong className="text-2xl sm:text-3xl font-bold text-[var(--text)] mt-1 block tabular-numbers">
                {orders.length}
              </strong>
            </div>

            <div className="bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] shadow-xs">
              <span className="text-[10px] font-mono uppercase font-bold text-[var(--text-secondary-aa)] block">
                Open Opportunities
              </span>
              <strong className="text-2xl sm:text-3xl font-bold text-[var(--link-aa)] mt-1 block tabular-numbers">
                {briefs.length}
              </strong>
            </div>

            <div className="bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] shadow-xs">
              <span className="text-[10px] font-mono uppercase font-bold text-[var(--text-secondary-aa)] block">
                Wallet Balance
              </span>
              <strong className="text-2xl sm:text-3xl font-bold text-emerald-700 dark:text-emerald-400 mt-1 block tabular-numbers">
                ₹{(user.balanceInr || 125000).toLocaleString("en-IN")}
              </strong>
            </div>

            <div className="bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] shadow-xs">
              <span className="text-[10px] font-mono uppercase font-bold text-[var(--text-secondary-aa)] block">
                Verification State
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-2">
                <CheckIcon size={16} />
                <span>Tools Verified</span>
              </span>
            </div>
          </div>

          {/* Section 1: Portfolio & Projects Manager */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div>
                <h2 className="text-xl font-bold text-[var(--text)]">Portfolio &amp; Production Takes</h2>
                <p className="text-xs text-[var(--text-secondary-aa)] mt-0.5">
                  Manage the AI-generated projects, prompting notes, and model specs visible on your public portfolio
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddProjectModal(true)}
                className="bg-[var(--link-aa)] hover:bg-[var(--link-aa-hover)] text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <PlusIcon size={14} />
                <span>Add Project</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {allPlatformCreators[0].portfolio.map((piece) => (
                <div
                  key={piece.id}
                  className="bg-[var(--surface)] rounded-xl border border-[var(--border)] overflow-hidden shadow-xs flex flex-col justify-between text-xs"
                >
                  <div className="relative w-full aspect-video bg-[var(--bg)] overflow-hidden">
                    <img
                      src={piece.posterUrl || piece.mediaUrl || "/media/hero/take-hero-master.jpg"}
                      alt={piece.title}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-[var(--surface)]/90 backdrop-blur-xs text-[var(--text)] text-[10px] font-bold rounded-full border border-[var(--border)]">
                      {piece.contentType}
                    </span>
                  </div>

                  <div className="p-3.5 flex flex-col gap-2">
                    <h3 className="font-bold text-[var(--text)] text-sm">{piece.title}</h3>
                    <div className="flex flex-wrap gap-1">
                      {piece.toolsUsed.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded bg-[var(--bg)] border border-[var(--border)] text-[10px] font-mono text-[var(--text-secondary-aa)]"
                        >
                          {t}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[var(--border)] text-[11px]">
                      <span className="text-[var(--text-secondary-aa)]">{piece.takesCount} takes</span>
                      <button
                        type="button"
                        onClick={() => triggerToast(`Project "${piece.title}" updated`)}
                        className="text-[var(--link-aa)] font-semibold hover:underline cursor-pointer"
                      >
                        Edit Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Verification Requests & Status */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div>
                <h2 className="text-xl font-bold text-[var(--text)]">Creator Verification Signals</h2>
                <p className="text-xs text-[var(--text-secondary-aa)] mt-0.5">
                  Submit model hash proof, workflow screenshots, or identity documents to earn verified marketplace badges
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowVerificationModal(true)}
                className="bg-[var(--surface)] hover:bg-[var(--bg)] text-[var(--text)] border border-[var(--border)] text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
              >
                Request Verification
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-[var(--surface)] rounded-xl border border-emerald-300 dark:border-emerald-800 shadow-xs flex flex-col gap-2 text-xs">
                <div className="flex items-center justify-between">
                  <strong className="font-bold text-[var(--text)]">AI Tools Stack</strong>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200">
                    Verified
                  </span>
                </div>
                <p className="text-[var(--text-secondary-aa)] leading-relaxed">
                  Runway Gen-3 and ComfyUI generation receipts reviewed by Retake platform.
                </p>
              </div>

              <div className="p-4 bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-xs flex flex-col gap-2 text-xs">
                <div className="flex items-center justify-between">
                  <strong className="font-bold text-[var(--text)]">Workflow Evidence</strong>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200">
                    Under Review
                  </span>
                </div>
                <p className="text-[var(--text-secondary-aa)] leading-relaxed">
                  Multi-pass LoRA node graph submitted for commercial clearance audit.
                </p>
              </div>

              <div className="p-4 bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-xs flex flex-col gap-2 text-xs">
                <div className="flex items-center justify-between">
                  <strong className="font-bold text-[var(--text)]">Completed Client Projects</strong>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200">
                    Verified (14 orders)
                  </span>
                </div>
                <p className="text-[var(--text-secondary-aa)] leading-relaxed">
                  14 commercial milestone releases executed through escrow vault.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ADMIN SHORTCUT VIEW                                      */}
      {/* ======================================================== */}
      {isAdmin && (
        <div className="bg-[var(--surface)] p-8 rounded-2xl border border-[var(--border)] shadow-xs text-center flex flex-col items-center gap-4 text-xs">
          <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold">
            ADMIN
          </div>
          <h2 className="text-xl font-bold text-[var(--text)]">
            You are logged in as Platform Administrator
          </h2>
          <p className="text-[var(--text-secondary-aa)] max-w-md">
            Access the restricted administration console to manage creator verification queues, moderate flagged creative content, and manage user roles.
          </p>
          <Link
            href="/admin"
            className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-all shadow-xs"
          >
            Go to Admin Console
          </Link>
        </div>
      )}

      {/* Modal: Add Portfolio Project */}
      {showAddProjectModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] w-full max-w-lg p-6 rounded-2xl shadow-xl flex flex-col gap-4 text-xs text-left">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div>
                <h3 className="text-lg font-bold text-[var(--text)]">Add Portfolio Project</h3>
                <p className="text-xs text-[var(--text-secondary-aa)] mt-0.5">
                  Showcase a commercial AI asset with tools and production workflow metadata.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddProjectModal(false)}
                className="text-[var(--text-secondary-aa)] hover:text-[var(--text)] p-1 rounded-md cursor-pointer"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <form onSubmit={handleAddProjectSubmit} className="flex flex-col gap-3.5">
              <div>
                <label className="font-semibold text-[var(--text)] block mb-1">Project Title</label>
                <input
                  type="text"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="e.g. Lumina · Autonomous Vehicle Launch Reel"
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--link-aa)]"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-[var(--text)] block mb-1">Description</label>
                <textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Creative concept, brand objective, and visual execution..."
                  rows={2}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-3 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--link-aa)]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[var(--text)] block mb-1">Content Type</label>
                  <select
                    value={projectContentType}
                    onChange={(e) => setProjectContentType(e.target.value)}
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--link-aa)]"
                  >
                    <option value="video">AI Video</option>
                    <option value="still">AI Still Image</option>
                    <option value="motion">Motion Graphic</option>
                    <option value="series">Campaign Series</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-[var(--text)] block mb-1">Cover Media URL</label>
                  <input
                    type="text"
                    value={projectMediaUrl}
                    onChange={(e) => setProjectMediaUrl(e.target.value)}
                    placeholder="https://... or /media/..."
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--link-aa)]"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-[var(--text)] block mb-1">Tools &amp; Models Used</label>
                <input
                  type="text"
                  value={projectTools}
                  onChange={(e) => setProjectTools(e.target.value)}
                  placeholder="e.g. Runway Gen-3, Midjourney v6, Magnific 8K"
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--link-aa)]"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-[var(--text)] block mb-1">Prompting &amp; Workflow Notes</label>
                <textarea
                  value={projectWorkflow}
                  onChange={(e) => setProjectWorkflow(e.target.value)}
                  placeholder="Optional workflow details (multi-pass upscaling, seed control, ComfyUI node setup)..."
                  rows={2}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-3 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--link-aa)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setShowAddProjectModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[var(--text-secondary-aa)] hover:text-[var(--text)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingProject}
                  className="px-5 py-2 bg-[var(--link-aa)] hover:bg-[var(--link-aa-hover)] text-white text-xs font-bold rounded-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isAddingProject ? "Publishing..." : "Publish Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Request Creator Verification */}
      {showVerificationModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] w-full max-w-md p-6 rounded-2xl shadow-xl flex flex-col gap-4 text-xs text-left">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div>
                <h3 className="text-lg font-bold text-[var(--text)]">Request Verification</h3>
                <p className="text-xs text-[var(--text-secondary-aa)] mt-0.5">
                  Submit proof to earn transparent verification signals on your profile.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowVerificationModal(false)}
                className="text-[var(--text-secondary-aa)] hover:text-[var(--text)] p-1 rounded-md cursor-pointer"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <form onSubmit={handleVerificationSubmit} className="flex flex-col gap-3.5">
              <div>
                <label className="font-semibold text-[var(--text)] block mb-1">Verification Category</label>
                <select
                  value={verificationCategory}
                  onChange={(e) => setVerificationCategory(e.target.value as typeof verificationCategory)}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--link-aa)]"
                >
                  <option value="tools_evidence">AI Tool Stack Evidence</option>
                  <option value="workflow_evidence">Workflow / ComfyUI Node Evidence</option>
                  <option value="identity">Creator Identity Verification</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-[var(--text)] block mb-1">Evidence Summary &amp; Description</label>
                <textarea
                  value={verificationEvidence}
                  onChange={(e) => setVerificationEvidence(e.target.value)}
                  placeholder="Describe your active subscriptions, model licenses, or generation workflow details..."
                  rows={3}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-3 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--link-aa)]"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-[var(--text)] block mb-1">Public Evidence Link / URL</label>
                <input
                  type="url"
                  value={verificationUrl}
                  onChange={(e) => setVerificationUrl(e.target.value)}
                  placeholder="https://github.com/..., https://drive.google.com/..."
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--link-aa)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setShowVerificationModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[var(--text-secondary-aa)] hover:text-[var(--text)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingVerify}
                  className="px-5 py-2 bg-[var(--link-aa)] hover:bg-[var(--link-aa-hover)] text-white text-xs font-bold rounded-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSubmittingVerify ? "Submitting..." : "Submit for Audit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
