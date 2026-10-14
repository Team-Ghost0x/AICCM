"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { indianCreators, allPlatformCreators } from "@/lib/contract/fixtures";
import { GigCard } from "@/components/gig-card";
import { CommunicationModal } from "@/components/communication-modal";
import { AuthModal } from "@/components/auth-modal";
import {
  ArrowIcon,
  CheckIcon,
  SearchIcon,
  PlusIcon,
  OrdersIcon,
  HeartIcon,
  ShareIcon,
  MessageIcon,
  BookmarkIcon,
  PlayIcon,
  SmartphoneIcon,
} from "@/components/icons";
import { getCurrentUser, onAuthChange, User } from "@/lib/client/auth";
import { playClickSound } from "@/lib/client/audio";

interface CategoryItem {
  id: string;
  name: string;
  description: string;
  iconName: string;
}

const MARKETPLACE_CATEGORIES: CategoryItem[] = [
  {
    id: "ai-filmmaking",
    name: "AI Filmmaking",
    description: "Cinematic directors producing narrative short films & trailers",
    iconName: "film",
  },
  {
    id: "ai-animation",
    name: "AI Animation",
    description: "Consistent multi-frame characters and stylistic animated sequences",
    iconName: "sparkles",
  },
  {
    id: "ai-product-ads",
    name: "AI Product Advertisements",
    description: "Photorealistic luxury commercial product visuals and motion spots",
    iconName: "cube",
  },
  {
    id: "ai-image-generation",
    name: "AI Image Generation",
    description: "Hyper-detailed concept art, key visuals, and campaign imagery",
    iconName: "image",
  },
  {
    id: "motion-graphics",
    name: "Motion Graphics",
    description: "Dynamic kinetic typography, UI sequences, and generative loops",
    iconName: "activity",
  },
  {
    id: "character-design",
    name: "Character Design",
    description: "Consistent LoRA-trained character turnarounds and IP assets",
    iconName: "user",
  },
  {
    id: "cinematic-storytelling",
    name: "Cinematic Storytelling",
    description: "Visual scripts, scene worldbuilding, and episodic storyboard reels",
    iconName: "tv",
  },
  {
    id: "social-media-creative",
    name: "Social Media Creative",
    description: "High-retention 9:16 vertical video hooks and viral brand assets",
    iconName: "smartphone",
  },
];

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(() => getCurrentUser());
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authRole, setAuthRole] = useState<"brand" | "creator">("creator");

  useEffect(() => {
    const unsubscribe = onAuthChange((updated) => {
      setUser(updated);
    });
    return () => unsubscribe();
  }, []);

  const heroCreator = allPlatformCreators[1] || allPlatformCreators[0];
  const arjunCreator = indianCreators[0];
  const arjunPiece = arjunCreator.portfolio[0];
  const arjunTakes = arjunPiece?.keyTakes || [];
  const [arjunTakeIndex, setArjunTakeIndex] = useState(arjunTakes.length > 0 ? arjunTakes.length - 1 : 0);
  const [arjunLiked, setArjunLiked] = useState(false);
  const featuredCreators = allPlatformCreators.slice(0, 6);

  // Keyboard J / K navigation for Arjun's interactive reel scrubber
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
      ) {
        return;
      }
      if (e.key === "j" || e.key === "J") {
        setArjunTakeIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === "k" || e.key === "K") {
        setArjunTakeIndex((prev) => Math.min((arjunTakes.length || 1) - 1, prev + 1));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [arjunTakes.length]);

  const activeArjunTake = arjunTakes[arjunTakeIndex] || {
    n: 9,
    imageUrl: arjunPiece.mediaUrl,
    tool: "Kling & ComfyUI",
    prompt: "high energy liquid splash, kinetic typography, neon lighting",
    whatChanged: "Final color grade and camera stabilization.",
  };

  return (
    <div className="w-full min-h-screen py-4 md:py-8 px-4 sm:px-6 lg:px-8 max-w-[1360px] mx-auto flex flex-col gap-12 md:gap-16">
      {/* Logged-in Quick Access Banner */}
      {user && (
        <div className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-[var(--text)]">
              Signed in as <strong className="font-bold">{user.name}</strong> ({user.role === "admin" ? "Platform Administrator" : user.role === "creator" ? "Verified Creator" : "Brand Partner"})
            </span>
          </div>
          <Link
            href={user.role === "admin" ? "/admin" : "/dashboard"}
            className="text-xs font-bold text-[var(--link-aa)] hover:underline inline-flex items-center gap-1.5"
          >
            <span>Open {user.role === "admin" ? "Admin Console" : user.role === "creator" ? "Creator Hub" : "Brand Dashboard"}</span>
            <ArrowIcon size={12} className="-rotate-90" />
          </Link>
        </div>
      )}
      {/* ======================================================== */}
      {/* 1. HERO SECTION                                          */}
      {/* ======================================================== */}
      <section className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12 pt-2 md:pt-4">
        {/* Left Column: Value Proposition & Dual CTAs */}
        <div className="flex-1 flex flex-col gap-5 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--surface)] border border-[var(--border)] w-fit select-none">
            <span className="w-2 h-2 rounded-full bg-[var(--link-aa)]" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-secondary-aa)]">
              AI-Native Creative Marketplace
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[var(--text)] tracking-tight leading-[1.12]">
            Find and hire world-class AI filmmakers &amp; generative artists
          </h1>

          <p className="text-base sm:text-lg text-[var(--text-secondary-aa)] leading-relaxed max-w-xl">
            Connect directly with verified AI directors, animators, and generative creators. Evaluate prompt workflows, inspect 4K iterative takes, and commission commercial generative campaigns with clear licensing.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/discover"
              className="px-6 py-3.5 bg-[var(--link-aa)] hover:bg-[var(--link-aa-hover)] text-white font-bold text-sm rounded-xl transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98] select-none flex items-center gap-2"
            >
              <SearchIcon size={18} />
              <span>Find AI Creators</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                setAuthRole("creator");
                setShowAuthModal(true);
              }}
              className="px-6 py-3.5 bg-[var(--surface)] hover:bg-[var(--bg)] text-[var(--text)] border border-[var(--border)] font-bold text-sm rounded-xl transition-colors cursor-pointer select-none"
            >
              Join as a Creator
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-6 pt-3 border-t border-[var(--border)] text-xs font-mono text-[var(--text-secondary-aa)]">
            <div>
              <strong className="text-sm font-bold text-[var(--text)] block">100%</strong>
              <span>Verified AI Tools</span>
            </div>
            <div className="w-[1px] h-8 bg-[var(--border)]" />
            <div>
              <strong className="text-sm font-bold text-[var(--text)] block">Commercial</strong>
              <span>Rights Clearance</span>
            </div>
            <div className="w-[1px] h-8 bg-[var(--border)]" />
            <div>
              <strong className="text-sm font-bold text-[var(--text)] block">Iterative</strong>
              <span>Milestone Takes</span>
            </div>
          </div>
        </div>

        {/* Right Column: Meta-Style Creator Post Card */}
        <div className="w-full lg:w-[480px] shrink-0">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm flex flex-col">
            {/* Header: Avatar with Instagram Story Gradient Ring + Details */}
            <div className="p-3.5 flex items-center justify-between border-b border-[var(--border)]/60 bg-[var(--surface)]">
              <Link
                href={`/creators/${heroCreator.handle}`}
                className="flex items-center gap-2.5 group/creator"
              >
                <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] shrink-0">
                  <div className="w-full h-full rounded-full bg-[var(--surface)] p-[1.5px] overflow-hidden flex items-center justify-center">
                    <img
                      src="/media/pieces/piece-1.jpg"
                      alt={heroCreator.displayName}
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <h3 className="text-xs font-bold text-[var(--text)] group-hover/creator:text-[var(--link-aa)] transition-colors">
                      {heroCreator.displayName}
                    </h3>
                    <span className="w-3.5 h-3.5 rounded-full bg-[#0095F6] text-white flex items-center justify-center shrink-0">
                      <CheckIcon size={9} strokeWidth={2.5} />
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary-aa)]">
                    @{heroCreator.handle} · Cinematic AI Director
                  </p>
                </div>
              </Link>
              <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold rounded-full">
                Available now
              </span>
            </div>

            {/* Media Canvas: Photorealistic 4:5 Master with Story Progress Segments */}
            <div className="relative aspect-[4/5] bg-black overflow-hidden select-none group">
              <img
                src="/media/pieces/piece-1.jpg"
                alt="NEO-SHINJUKU 2099 // UNIT-07"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />

              {/* Instagram Stories Progress Segments */}
              <div className="absolute top-3 inset-x-3 z-20 flex items-center gap-1.5 pointer-events-none">
                <div className="flex-1 h-[2.5px] bg-white/40 rounded-full" />
                <div className="flex-1 h-[2.5px] bg-white/40 rounded-full" />
                <div className="flex-1 h-[3px] bg-white rounded-full shadow-xs" />
                <div className="flex-1 h-[2.5px] bg-white/40 rounded-full" />
                <div className="flex-1 h-[2.5px] bg-white/40 rounded-full" />
              </div>

              {/* Floating Take Tag */}
              <div className="absolute top-4 left-3 z-20 bg-black/70 backdrop-blur-md text-white text-[11px] font-semibold px-3 py-1 rounded-full border border-white/20 shadow-md flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Take 9 of 23 · Master Cut</span>
              </div>
            </div>

            {/* Meta Action Bar */}
            <div className="px-3.5 pt-3 pb-1 flex items-center justify-between text-[var(--text)]">
              <div className="flex items-center gap-3.5">
                <HeartIcon size={20} className="text-rose-500" fill="currentColor" />
                <MessageIcon size={20} />
                <ShareIcon size={19} />
              </div>
              <span className="text-[11px] font-semibold text-[var(--text-secondary-aa)]">
                842 creative agency likes
              </span>
            </div>

            {/* Caption & Metadata */}
            <div className="p-3.5 pt-1 flex flex-col gap-2.5">
              <div className="text-xs text-[var(--text)] leading-snug">
                <span className="font-bold mr-1.5">mira-okonkwo</span>
                <span className="text-[var(--text-secondary-aa)]">
                  NEO-SHINJUKU 2099 // UNIT-07 — 8K cinematic teaser produced for commercial brand campaign.
                </span>
              </div>

              {/* Hashtag Tool Chips */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-medium text-[var(--link-aa)] hover:underline cursor-pointer">#MidjourneyV6</span>
                <span className="text-[11px] font-medium text-[var(--link-aa)] hover:underline cursor-pointer">#Magnific8K</span>
                <span className="text-[11px] font-medium text-[var(--link-aa)] hover:underline cursor-pointer">#RunwayGen3</span>
                <span className="text-[11px] font-medium text-[var(--link-aa)] hover:underline cursor-pointer">#SciFiDirector</span>
              </div>

              {/* Turnaround & Action */}
              <div className="pt-2.5 border-t border-[var(--border)] flex items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] text-[var(--text-secondary-aa)] font-medium block">4-day turnaround</span>
                  <strong className="text-sm font-bold text-[var(--text)]">From ₹25,000</strong>
                </div>
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(true)}
                  className="px-4 py-2 bg-[var(--link-aa)] hover:bg-[var(--link-aa-hover)] text-white text-xs font-bold rounded-lg shadow-xs transition-transform duration-150 hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <span>Invite to Brief</span>
                  <ArrowIcon size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. SPECIALIZATION CATEGORIES (Meta Topic Cards)          */}
      {/* ======================================================== */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-[var(--border)] pb-3">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text)] tracking-tight">
              Specialization Categories
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary-aa)] mt-0.5">
              Explore specialized generative talent across core AI production disciplines
            </p>
          </div>
          <Link
            href="/discover"
            className="text-xs font-bold font-mono text-[var(--link-aa)] hover:underline flex items-center gap-1"
          >
            <span>Browse all categories</span>
            <ArrowIcon size={13} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {MARKETPLACE_CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={`/discover?category=${encodeURIComponent(cat.id)}`}
              className="bg-[var(--surface)] hover:bg-[var(--bg)] border border-[var(--border)] hover:border-[var(--control-border)] p-4 rounded-2xl transition-all flex flex-col justify-between gap-3 group shadow-xs cursor-pointer"
            >
              <div className="flex flex-col gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center text-[var(--link-aa)] group-hover:scale-105 transition-transform">
                  <PlayIcon size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--text)] group-hover:text-[var(--link-aa)] transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary-aa)] mt-1 leading-relaxed">
                    {cat.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center text-[11px] font-semibold text-[var(--link-aa)] pt-1 border-t border-[var(--border)]/50">
                <span>Explore creators</span>
                <ArrowIcon size={12} className="ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. HOW IT WORKS (Meta 4-Step Process)                    */}
      {/* ======================================================== */}
      <section className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--link-aa)]">
            Streamlined 4-Step Production Pipeline
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text)] tracking-tight mt-1">
            How Retake Works for Brands &amp; Creators
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary-aa)] mt-1.5">
            From creative brief to final 4K commercial clearance with milestone escrow transparency.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Step 1 */}
          <div className="flex flex-col gap-3 p-5 rounded-2xl bg-[var(--bg)] border border-[var(--border)]">
            <span className="w-9 h-9 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs font-bold flex items-center justify-center text-[var(--link-aa)] shadow-xs">
              01
            </span>
            <h4 className="text-sm font-bold text-[var(--text)]">Discover AI Directors</h4>
            <p className="text-xs text-[var(--text-secondary-aa)] leading-relaxed">
              Filter creators by specific AI tools (ComfyUI, Runway, Kling, Flux), verified skills, turnaround, and review real prompt-to-pixel takes.
            </p>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col gap-3 p-5 rounded-2xl bg-[var(--bg)] border border-[var(--border)]">
            <span className="w-9 h-9 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs font-bold flex items-center justify-center text-[var(--link-aa)] shadow-xs">
              02
            </span>
            <h4 className="text-sm font-bold text-[var(--text)]">Commission Creative Brief</h4>
            <p className="text-xs text-[var(--text-secondary-aa)] leading-relaxed">
              Define deliverables, style, aspect ratio, budget, and commercial usage rights. Utilize optional AI assistance to generate a structured brief draft.
            </p>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col gap-3 p-5 rounded-2xl bg-[var(--bg)] border border-[var(--border)]">
            <span className="w-9 h-9 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs font-bold flex items-center justify-center text-[var(--link-aa)] shadow-xs">
              03
            </span>
            <h4 className="text-sm font-bold text-[var(--text)]">Inspect Milestone Takes</h4>
            <p className="text-xs text-[var(--text-secondary-aa)] leading-relaxed">
              Review iterative milestone takes, provide revision notes on specific seconds, and communicate directly inside the dedicated project workspace.
            </p>
          </div>

          {/* Step 4 */}
          <div className="flex flex-col gap-3 p-5 rounded-2xl bg-[var(--bg)] border border-[var(--border)]">
            <span className="w-9 h-9 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs font-bold flex items-center justify-center text-[var(--link-aa)] shadow-xs">
              04
            </span>
            <h4 className="text-sm font-bold text-[var(--text)]">Escrow &amp; 4K Delivery</h4>
            <p className="text-xs text-[var(--text-secondary-aa)] leading-relaxed">
              Inspect final master exports, approve deliverables, release milestone escrow, and receive documented commercial usage rights.
            </p>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. PRODUCTION WORKFLOW PROOF (Meta Reels Studio Layout)   */}
      {/* ======================================================== */}
      <section className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--link-aa)]" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--link-aa)]">
                Verified Production Proof · Reel Take Scrubber
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--text)] tracking-tight">
              Inspect the real generative iteration behind the final cut
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-secondary-aa)]">
              Piece: <strong className="text-[var(--text)]">{arjunPiece.title}</strong> ({arjunTakes.length} iterative takes)
            </span>
          </div>
        </div>

        {/* Dual Column Meta Reels Studio: Phone Frame on Left, Inspector on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Phone-Framed Vertical Reel (Constrained 360px max width) */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="w-full max-w-[340px] sm:max-w-[360px] aspect-[9/16] rounded-3xl overflow-hidden border-2 border-[var(--border)] shadow-xl bg-black relative flex flex-col justify-between select-none">
              {/* Active Take Media */}
              <div className="absolute inset-0 z-0">
                <img
                  src={activeArjunTake.imageUrl || arjunPiece.mediaUrl}
                  alt={`${arjunPiece.title} Take ${activeArjunTake.n}`}
                  className="w-full h-full object-cover transition-all duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />
              </div>

              {/* Instagram Stories Progress Segments at Top */}
              <div className="relative z-10 p-3 pt-3.5 flex items-center gap-1 pointer-events-none">
                {arjunTakes.map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-[2.5px] rounded-full transition-all ${
                      i <= arjunTakeIndex ? "bg-white shadow-xs" : "bg-white/30"
                    }`}
                  />
                ))}
              </div>

              {/* Floating Take Tag */}
              <div className="relative z-10 px-3 self-start">
                <div className="bg-black/75 backdrop-blur-md text-white text-[11px] font-semibold px-3 py-1 rounded-full border border-white/20 shadow-md inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>
                    Take {activeArjunTake.n} of {arjunTakes.length} · {activeArjunTake.tool}
                  </span>
                </div>
              </div>

              {/* Floating Right Actions (Like Instagram Reels) */}
              <div className="absolute right-3 bottom-24 z-20 flex flex-col items-center gap-4 text-white">
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setArjunLiked(!arjunLiked);
                  }}
                  className="flex flex-col items-center gap-1 cursor-pointer hover:scale-110 transition-transform"
                  aria-label={arjunLiked ? "Unlike reel" : "Like reel"}
                >
                  <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-xs flex items-center justify-center border border-white/10">
                    <HeartIcon
                      size={20}
                      className={arjunLiked ? "text-rose-500" : "text-white"}
                      fill={arjunLiked ? "currentColor" : "none"}
                    />
                  </div>
                  <span className="text-[10px] font-semibold">{arjunLiked ? "1.4k" : "1.3k"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setIsInviteOpen(true);
                  }}
                  className="flex flex-col items-center gap-1 cursor-pointer hover:scale-110 transition-transform"
                  aria-label="Invite creator"
                >
                  <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-xs flex items-center justify-center border border-white/10">
                    <MessageIcon size={19} />
                  </div>
                  <span className="text-[10px] font-semibold">Invite</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    if (typeof navigator !== "undefined" && navigator.share) {
                      navigator.share({ title: arjunPiece.title, url: window.location.href }).catch(() => {});
                    }
                  }}
                  className="flex flex-col items-center gap-1 cursor-pointer hover:scale-110 transition-transform"
                  aria-label="Share reel"
                >
                  <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-xs flex items-center justify-center border border-white/10">
                    <ShareIcon size={19} />
                  </div>
                  <span className="text-[10px] font-semibold">Share</span>
                </button>
              </div>

              {/* Bottom Reel Telemetry & Meta Profile Info */}
              <div className="relative z-10 p-4 flex flex-col gap-2 text-white">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full p-[1.5px] bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] shrink-0">
                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center font-bold text-xs">
                      {arjunCreator.displayName.charAt(0)}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold leading-tight">{arjunCreator.displayName}</span>
                      <span className="w-3 h-3 rounded-full bg-[#0095F6] text-white flex items-center justify-center">
                        <CheckIcon size={8} strokeWidth={2.5} />
                      </span>
                    </div>
                    <span className="text-[10px] text-white/70">@{arjunCreator.handle}</span>
                  </div>
                </div>

                <div className="text-xs font-semibold leading-snug line-clamp-2">
                  {arjunPiece.title} — {arjunPiece.description}
                </div>

                <div className="flex items-center justify-between text-[11px] text-white/80 pt-1 border-t border-white/15">
                  <span className="font-mono text-purple-300">
                    Tool: {activeArjunTake.tool}
                  </span>
                  <span className="text-emerald-400 font-bold">100% Cleared</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Meta Creator & Take Inspector Panel */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            {/* Creator Row */}
            <div className="p-4 rounded-2xl bg-[var(--bg)] border border-[var(--border)] flex items-center justify-between gap-3">
              <Link
                href={`/creators/${arjunCreator.handle}`}
                className="flex items-center gap-3 group"
              >
                <div className="w-11 h-11 rounded-full p-[2px] bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] shrink-0">
                  <div className="w-full h-full rounded-full bg-[var(--surface)] p-[1.5px] overflow-hidden flex items-center justify-center">
                    <div className="w-full h-full rounded-full bg-[var(--gradient-text-safe)] text-white font-bold text-sm flex items-center justify-center">
                      {arjunCreator.displayName.charAt(0)}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-[var(--text)] group-hover:text-[var(--link-aa)] transition-colors">
                      {arjunCreator.displayName}
                    </h3>
                    <span className="w-3.5 h-3.5 rounded-full bg-[#0095F6] text-white flex items-center justify-center">
                      <CheckIcon size={9} strokeWidth={2.5} />
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary-aa)]">
                    @{arjunCreator.handle} · {arjunCreator.headline}
                  </p>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setIsInviteOpen(true);
                }}
                className="px-4 py-2 bg-[var(--link-aa)] hover:bg-[var(--link-aa-hover)] text-white text-xs font-bold rounded-lg shadow-xs transition-transform duration-150 hover:scale-105 active:scale-95 cursor-pointer"
              >
                Invite to Brief
              </button>
            </div>

            {/* Scrubber Range Slider & Pill Navigation */}
            <div className="flex flex-col gap-3 p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[var(--text)] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--link-aa)]" />
                  <span>Interactive Iteration Scrubber</span>
                </span>
                <span className="text-[11px] text-[var(--text-secondary-aa)] font-mono">
                  Use J / K keys to scrub
                </span>
              </div>

              {/* Range input slider */}
              <input
                type="range"
                role="slider"
                min={0}
                max={(arjunTakes.length || 1) - 1}
                value={arjunTakeIndex}
                onChange={(e) => {
                  playClickSound();
                  setArjunTakeIndex(Number(e.target.value));
                }}
                aria-valuemin={0}
                aria-valuemax={(arjunTakes.length || 1) - 1}
                aria-valuenow={arjunTakeIndex}
                aria-valuetext={`Take ${activeArjunTake.n} of ${arjunTakes.length}: ${activeArjunTake.whatChanged}`}
                className="w-full cursor-pointer accent-[var(--link-aa)]"
              />

              {/* Tactile Take Pills */}
              <div className="flex justify-between items-center gap-1.5 flex-wrap pt-1">
                {arjunTakes.map((take, idx) => (
                  <button
                    key={take.n}
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setArjunTakeIndex(idx);
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      idx === arjunTakeIndex
                        ? "bg-[var(--text)] text-[var(--surface)] font-bold shadow-xs scale-105"
                        : "bg-[var(--bg)] border border-[var(--border)] text-[var(--text-secondary-aa)] hover:text-[var(--text)]"
                    }`}
                  >
                    {idx === arjunTakes.length - 1 ? "Final Master" : `Take ${take.n}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Take Details Card */}
            <div className="p-4 rounded-2xl bg-[var(--bg)] border border-[var(--border)] flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs border-b border-[var(--border)] pb-2.5">
                <span className="font-bold text-[var(--text)]">
                  Take #{activeArjunTake.n} Specs &amp; Workflow Notes
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold">
                  {activeArjunTake.tool}
                </span>
              </div>

              {/* Prompt Info */}
              <div className="flex flex-col gap-1 text-xs">
                <span className="text-[11px] font-semibold uppercase text-[var(--text-secondary-aa)] font-mono">
                  Prompt Iteration:
                </span>
                <p className="p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] font-mono text-[11px] leading-relaxed">
                  &ldquo;{activeArjunTake.prompt}&rdquo;
                </p>
              </div>

              {/* What Changed Info */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[11px] font-semibold uppercase text-[var(--text-secondary-aa)] font-mono">
                  Milestone Delta:
                </span>
                <span className="text-[var(--text)] font-medium">
                  {activeArjunTake.whatChanged}
                </span>
              </div>
            </div>

            {/* Quick Guarantees */}
            <div className="grid grid-cols-3 gap-3 text-center text-xs font-mono text-[var(--text-secondary-aa)] pt-1">
              <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                <strong className="text-sm font-bold text-[var(--text)] block">{arjunTakes.length} Takes</strong>
                <span>Documented</span>
              </div>
              <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                <strong className="text-sm font-bold text-[var(--text)] block">6 Hours</strong>
                <span>Turnaround</span>
              </div>
              <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                <strong className="text-sm font-bold text-[var(--text)] block">100%</strong>
                <span>Cleared Rights</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. CREATOR DISCOVERY PREVIEW (Meta GigCards)             */}
      {/* ======================================================== */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-[var(--border)] pb-3">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text)] tracking-tight">
              Featured AI Filmmakers &amp; Studios
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary-aa)] mt-0.5">
              Evaluated on iteration count, verified tool stack, and commercial clearance
            </p>
          </div>
          <Link
            href="/discover"
            className="text-xs font-bold font-mono text-[var(--link-aa)] hover:underline flex items-center gap-1 group"
          >
            <span>View all {allPlatformCreators.length} creators</span>
            <ArrowIcon size={13} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredCreators.map((creator) => (
            <GigCard key={creator.id} creator={creator} />
          ))}
        </div>
      </section>

      {/* ======================================================== */}
      {/* 6. FINAL CALL TO ACTION (Meta Surface Design)            */}
      {/* ======================================================== */}
      <section className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-8 sm:p-12 text-center flex flex-col items-center gap-5 shadow-xs">
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--link-aa)]">
          Start Commissioning Today
        </span>
        <h2 className="text-3xl sm:text-4xl font-black text-[var(--text)] tracking-tight max-w-xl">
          Ready to produce next-generation AI campaigns?
        </h2>
        <p className="text-sm sm:text-base text-[var(--text-secondary-aa)] max-w-lg leading-relaxed">
          Join leading brands and creative agencies hiring generative talent, or create your creator portfolio to get hired on your real production workflows.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/discover"
            className="px-6 py-3.5 bg-[var(--link-aa)] hover:bg-[var(--link-aa-hover)] text-white font-bold text-sm rounded-xl transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98] select-none"
          >
            Find AI Creators
          </Link>
          <button
            type="button"
            onClick={() => {
              setAuthRole("creator");
              setShowAuthModal(true);
            }}
            className="px-6 py-3.5 bg-[var(--bg)] hover:bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] font-bold text-sm rounded-xl transition-colors cursor-pointer select-none"
          >
            Join as a Creator
          </button>
        </div>
      </section>

      {/* Communication / Invitation Modal */}
      <CommunicationModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        targetCreator={heroCreator}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultRole={authRole}
        defaultTab="signup"
      />
    </div>
  );
}
