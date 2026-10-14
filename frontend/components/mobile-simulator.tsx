"use client";

import React, { useState } from "react";
import { GradientMedia } from "./gradient-media";
import {
  HomeIcon,
  SearchIcon,
  PostBriefIcon,
  HeartIcon,
  UserIcon,
  BookmarkIcon,
  ShareIcon,
  CloseIcon,
  SmartphoneIcon,
  PlusIcon,
} from "./icons";
import { allPlatformCreators } from "@/lib/contract/fixtures";
import { CommunicationModal } from "./communication-modal";

type MobileScreen = "feed" | "discover" | "profile" | "viewer";

export function MobileSimulator() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState<MobileScreen>("feed");
  const [currentTake, setCurrentTake] = useState(9);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const mira = allPlatformCreators[1] || allPlatformCreators[0];

  const takeDetails: Record<number, { prompt: string; change: string }> = {
    1: {
      prompt: "perfume bottle on dark beach, dramatic lighting, high key mist",
      change: "Initial rough generation. Lighting flat, bottle glass opaque.",
    },
    4: {
      prompt: "perfume bottle on wet dark sand, blue hour specular highlights",
      change: "Improved sand reflections and mist. Bottle silhouette refined.",
    },
    9: {
      prompt:
        "perfume bottle on wet black basalt, rim light, water droplets, shallow depth of field",
      change: "Rim light and droplets. The mood finally lands.",
    },
    17: {
      prompt:
        "perfume bottle on wet black basalt, sharp caustic refraction, droplets",
      change: "Refractions locked, color balance harmonized.",
    },
    23: {
      prompt:
        "perfume bottle on wet black basalt, iridescent rim light, condensation, commercial pass",
      change: "Final color grade and commercial upscaling pass completed.",
    },
  };

  const currentTakeInfo = takeDetails[currentTake] || takeDetails[9];

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 md:bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-full shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:-translate-y-0.5 active:translate-y-0.5 transition-all cursor-pointer group"
        aria-label="Open Mobile App Simulator"
      >
        <SmartphoneIcon size={16} className="group-hover:rotate-6 transition-transform" />
        <span>Mobile App Preview</span>
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
      </button>

      {/* Simulator Modal Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-md animate-fade-in">
          {/* Container Card */}
          <div className="relative flex flex-col items-center">
            {/* Top Toolbar */}
            <div className="w-full max-w-[420px] mb-3 flex items-center justify-between px-2 text-white">
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-2 py-1 rounded-full text-[11px] font-medium">
                <button
                  type="button"
                  onClick={() => setActiveScreen("feed")}
                  className={`px-2.5 py-0.5 rounded-full transition-colors cursor-pointer ${
                    activeScreen === "feed" ? "bg-purple-600 text-white font-bold" : "hover:text-white/80"
                  }`}
                >
                  Feed
                </button>
                <button
                  type="button"
                  onClick={() => setActiveScreen("discover")}
                  className={`px-2.5 py-0.5 rounded-full transition-colors cursor-pointer ${
                    activeScreen === "discover" ? "bg-purple-600 text-white font-bold" : "hover:text-white/80"
                  }`}
                >
                  Discover
                </button>
                <button
                  type="button"
                  onClick={() => setActiveScreen("profile")}
                  className={`px-2.5 py-0.5 rounded-full transition-colors cursor-pointer ${
                    activeScreen === "profile" ? "bg-purple-600 text-white font-bold" : "hover:text-white/80"
                  }`}
                >
                  Profile
                </button>
                <button
                  type="button"
                  onClick={() => setActiveScreen("viewer")}
                  className={`px-2.5 py-0.5 rounded-full transition-colors cursor-pointer ${
                    activeScreen === "viewer" ? "bg-purple-600 text-white font-bold" : "hover:text-white/80"
                  }`}
                >
                  Viewer
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close Mobile Simulator"
              >
                <CloseIcon size={16} />
              </button>
            </div>

            {/* Realistic iPhone Device Shell */}
            <div className="w-[375px] h-[780px] bg-[#1a1a1a] rounded-[50px] p-3 shadow-2xl ring-1 ring-white/20 border-4 border-[#2d2d2d] relative flex flex-col overflow-hidden">
              {/* Dynamic Island / Notch */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-30 flex items-center justify-end px-3">
                <div className="w-2.5 h-2.5 rounded-full bg-[#111] ring-1 ring-blue-900/40" />
              </div>

              {/* Status Bar */}
              <div className="w-full pt-2 pb-1 px-7 flex items-center justify-between text-[11px] font-semibold text-zinc-900 dark:text-zinc-100 z-20 select-none">
                <span>9:41</span>
                <div className="flex items-center gap-1 text-[10px]">
                  <span>5G</span>
                  <div className="w-4 h-2 rounded-[2px] border border-current p-[1px]">
                    <div className="h-full w-full bg-current rounded-[1px]" />
                  </div>
                </div>
              </div>

              {/* Screen Content Wrapper (Native mobile app styling) */}
              <div className="flex-1 bg-[#f8f9fa] text-zinc-900 overflow-y-auto overflow-x-hidden flex flex-col rounded-[38px] relative">
                {/* Screen 1: Mobile Feed */}
                {activeScreen === "feed" && (
                  <div className="flex-1 flex flex-col pb-16">
                    {/* Top App Header with Paper Airplane */}
                    <div className="px-5 pt-3 pb-2 flex items-center justify-between">
                      <span className="text-xl font-black tracking-tight text-zinc-950">
                        retake
                      </span>
                      <div className="text-zinc-700">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                          <line x1="22" y1="2" x2="11" y2="13" />
                          <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                      </div>
                    </div>

                    {/* Stories Carousel matching PDF Page 1 */}
                    <div className="px-4 py-2 flex items-center gap-3 overflow-x-auto no-scrollbar">
                      {/* + Your take */}
                      <button
                        type="button"
                        onClick={() => setActiveScreen("viewer")}
                        className="flex flex-col items-center flex-shrink-0 cursor-pointer"
                      >
                        <div className="w-13 h-13 rounded-full border-2 border-dashed border-purple-500 flex items-center justify-center bg-white">
                          <PlusIcon size={16} className="text-purple-600 font-bold" />
                        </div>
                        <span className="text-[10px] text-zinc-600 mt-1">Your take</span>
                      </button>

                      {allPlatformCreators.slice(0, 5).map((c, i) => {
                        const ringClasses = [
                          "ring-gradient-teal",
                          "ring-gradient-amber",
                          "ring-gradient-purple",
                          "ring-gradient-pink",
                          "ring-gradient-teal",
                        ];
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setActiveScreen("profile")}
                            className="flex flex-col items-center flex-shrink-0 cursor-pointer"
                          >
                            <div
                              className={`w-13 h-13 rounded-full p-[2.5px] ${ringClasses[i % ringClasses.length]}`}
                            >
                              <div className="w-full h-full rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center font-bold text-xs text-zinc-900 dark:text-white">
                                {c.displayName.charAt(0)}
                              </div>
                            </div>
                            <span className="text-[10px] text-zinc-600 mt-1 truncate max-w-[56px]">
                              {c.displayName.split(" ")[0]}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Active Creator Pill matching PDF Page 1 */}
                    <div className="px-5 py-2 flex items-center justify-between border-t border-zinc-200/60 mt-1">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full p-[1.5px] ring-gradient-teal">
                          <div className="w-full h-full rounded-full bg-cyan-400 text-white font-bold text-xs flex items-center justify-center">
                            M
                          </div>
                        </div>
                        <div>
                          <div className="font-bold text-xs text-zinc-900">
                            {mira.displayName}
                          </div>
                          <div className="text-[10px] text-zinc-500">
                            AI filmmaker, beauty and fragrance. Sample
                          </div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200">
                        Open for work
                      </span>
                    </div>

                    {/* Hero Piece Card (Basalt perfume centerpiece) */}
                    <div className="px-4 my-2">
                      <div
                        onClick={() => setActiveScreen("viewer")}
                        className="relative rounded-2xl overflow-hidden shadow-sm cursor-pointer group"
                      >
                        <GradientMedia
                          variant="perfume-hero"
                          bottleTitle="Basalt"
                          aspectRatio="aspect-[4/5]"
                          takeLabel="Take 9 of 23 · Midjourney"
                          showInteractiveShine
                          showProgressSegments={true}
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsInviteOpen(true);
                          }}
                          className="absolute bottom-3 right-3 px-3 py-1.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-semibold rounded-full shadow-md transition-all active:scale-95 cursor-pointer"
                        >
                          Invite to a brief
                        </button>
                      </div>
                    </div>

                    {/* Engagement Bar & Title matching PDF Page 1 */}
                    <div className="px-5 py-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setLiked(!liked)}
                            className={`p-1 transition-colors cursor-pointer ${
                              liked ? "text-rose-500" : "text-zinc-700"
                            }`}
                          >
                            <HeartIcon
                              size={18}
                              fill={liked ? "currentColor" : "none"}
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsInviteOpen(true)}
                            className="p-1 text-zinc-700 hover:text-zinc-950 transition-colors cursor-pointer"
                          >
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSaved(!saved)}
                            className={`p-1 transition-colors cursor-pointer ${
                              saved ? "text-purple-600" : "text-zinc-700"
                            }`}
                          >
                            <BookmarkIcon
                              size={18}
                              fill={saved ? "currentColor" : "none"}
                            />
                          </button>
                        </div>
                      </div>

                      <div className="font-bold text-xs text-zinc-950 mt-1">
                        Basalt, a fragrance still
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        23 takes, 14 hours. Cleared for commercial use.
                      </div>
                    </div>

                    {/* Tags matching PDF Page 1 */}
                    <div className="px-5 py-1.5 flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 bg-zinc-200/70 text-zinc-700 text-[10px] rounded-full font-medium">
                        Midjourney
                      </span>
                      <span className="px-2 py-0.5 bg-zinc-200/70 text-zinc-700 text-[10px] rounded-full font-medium">
                        Magnific
                      </span>
                      <span className="px-2 py-0.5 bg-teal-50 text-teal-700 border border-teal-200 text-[10px] rounded-full font-semibold">
                        Tools verified
                      </span>
                    </div>
                  </div>
                )}

                {/* Screen 2: Mobile Discover matching PDF Page 2 */}
                {activeScreen === "discover" && (
                  <div className="flex-1 flex flex-col px-4 pt-3 pb-16">
                    {/* Search Input */}
                    <div className="relative mb-2.5">
                      <SearchIcon
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                      />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search tools, styles, creators"
                        className="w-full bg-white border border-zinc-200 pl-9 pr-3 py-2 rounded-full text-xs placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    {/* Filter Pills from PDF Page 2 */}
                    <div className="flex items-center gap-1.5 mb-2 overflow-x-auto no-scrollbar text-[11px]">
                      <span className="px-2.5 py-1 bg-zinc-900 text-white rounded-full font-bold">
                        Runway
                      </span>
                      <span className="px-2.5 py-1 bg-zinc-900 text-white rounded-full font-bold">
                        9:16
                      </span>
                      <span className="px-2.5 py-1 bg-zinc-100 text-zinc-700 border border-zinc-200 rounded-full font-medium">
                        Verified tools
                      </span>
                      <span className="px-2.5 py-1 bg-zinc-100 text-zinc-700 border border-zinc-200 rounded-full font-medium">
                        Open now
                      </span>
                    </div>

                    <div className="text-[11px] font-bold text-zinc-900 mb-2">
                      0 creators match all 2 filters
                    </div>

                    {/* Relaxation banner from PDF Page 2 */}
                    <div className="p-2.5 rounded-xl bg-amber-100/70 border border-amber-200 flex items-center justify-between mb-3 text-[10px]">
                      <div className="text-amber-950 font-medium">
                        Drop Runway and 2 creators match. Drop 9:16 and 2 match.
                      </div>
                      <button
                        type="button"
                        onClick={() => alert("Dropped Runway filter!")}
                        className="px-2 py-1 bg-zinc-950 text-white font-bold rounded text-[9px] cursor-pointer"
                      >
                        Drop Runway
                      </button>
                    </div>

                    <div className="text-[11px] font-bold text-zinc-800 mb-2">
                      Closest to what you asked for
                    </div>

                    {/* Multi-stop gradient grid (Piece-9hpk palette) */}
                    <div className="grid grid-cols-2 gap-2">
                      <div
                        onClick={() => setActiveScreen("viewer")}
                        className="cursor-pointer"
                      >
                        <GradientMedia
                          variant="magenta-deep"
                          aspectRatio="aspect-square"
                          takeLabel="9:16"
                          showProgressSegments={false}
                        />
                      </div>
                      <div
                        onClick={() => setActiveScreen("viewer")}
                        className="cursor-pointer"
                      >
                        <GradientMedia
                          variant="teal-flow"
                          aspectRatio="aspect-square"
                          showProgressSegments={false}
                        />
                      </div>
                      <div
                        onClick={() => setActiveScreen("viewer")}
                        className="cursor-pointer"
                      >
                        <GradientMedia
                          variant="amber-glow"
                          aspectRatio="aspect-square"
                          takeLabel="Take 4/12"
                          showProgressSegments={false}
                        />
                      </div>
                      <div
                        onClick={() => setActiveScreen("viewer")}
                        className="cursor-pointer"
                      >
                        <GradientMedia
                          variant="indigo-neon"
                          aspectRatio="aspect-square"
                          takeLabel="9:16"
                          showProgressSegments={false}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Screen 3: Mobile Profile matching PDF Page 3 */}
                {activeScreen === "profile" && (
                  <div className="flex-1 flex flex-col px-4 pt-3 pb-16">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-zinc-900">
                          {mira.handle}
                        </span>
                        <span className="px-1.5 py-0.5 bg-teal-50 text-teal-700 border border-teal-200 text-[9px] font-bold rounded-full">
                          Tools verified
                        </span>
                      </div>
                    </div>

                    {/* Centered Large Avatar Ring */}
                    <div className="flex flex-col items-center mb-2">
                      <div className="w-20 h-20 rounded-full p-[3px] ring-gradient-teal mb-2">
                        <div className="w-full h-full rounded-full bg-gradient-to-tr from-cyan-400 to-teal-500 flex items-center justify-center text-white text-2xl font-black">
                          {mira.displayName.charAt(0)}
                        </div>
                      </div>
                    </div>

                    {/* Stats Counter matching PDF Page 3 */}
                    <div className="grid grid-cols-3 gap-2 bg-white border border-zinc-200/80 rounded-xl p-2.5 text-center mb-2">
                      <div>
                        <div className="text-xs font-bold text-zinc-900">9</div>
                        <div className="text-[10px] text-zinc-500">Pieces</div>
                      </div>
                      <div className="border-x border-zinc-100">
                        <div className="text-xs font-bold text-zinc-900">214</div>
                        <div className="text-[10px] text-zinc-500">Takes</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-zinc-900">4 days</div>
                        <div className="text-[10px] text-zinc-500">Turnaround</div>
                      </div>
                    </div>

                    {/* Name & Bio matching PDF Page 3 */}
                    <div className="font-bold text-sm text-zinc-950 mb-0.5">
                      {mira.displayName}
                    </div>
                    <p className="text-[10px] text-zinc-600 leading-relaxed mb-2">
                      AI filmmaker for beauty and fragrance. Shows every take, because the brief usually changes at take nine. From 25,000 rupees. Open for work. Sample profile.
                    </p>

                    {/* Tool Badges matching PDF Page 3 */}
                    <div className="flex items-center gap-1 mb-3">
                      <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-[10px] rounded-full">
                        Midjourney
                      </span>
                      <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-[10px] rounded-full">
                        Runway
                      </span>
                      <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-[10px] rounded-full">
                        Kling
                      </span>
                      <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-[10px] rounded-full">
                        Magnific
                      </span>
                    </div>

                    {/* Action Buttons row */}
                    <div className="flex items-center gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() => setIsInviteOpen(true)}
                        className="flex-1 py-1.5 bg-[#7c3aed] text-white text-xs font-bold rounded-xl cursor-pointer"
                      >
                        Invite to a brief
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsInviteOpen(true)}
                        className="flex-1 py-1.5 bg-white border border-purple-600 text-purple-600 text-xs font-bold rounded-xl cursor-pointer"
                      >
                        Message
                      </button>
                    </div>

                    {/* 4 Circular Badges matching PDF Page 3 */}
                    <div className="flex items-center justify-between px-2 mb-2">
                      <div className="flex flex-col items-center">
                        <div className="w-11 h-11 rounded-full border border-zinc-200 bg-white flex items-center justify-center font-bold text-[10px]">
                          Flow
                        </div>
                        <span className="text-[9px] text-zinc-500 mt-1">Process</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="w-11 h-11 rounded-full border border-zinc-200 bg-white flex items-center justify-center font-bold text-[10px]">
                          Kit
                        </div>
                        <span className="text-[9px] text-zinc-500 mt-1">Tools</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="w-11 h-11 rounded-full border border-zinc-200 bg-white flex items-center justify-center font-bold text-[10px]">
                          Rights
                        </div>
                        <span className="text-[9px] text-zinc-500 mt-1">Licence</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="w-11 h-11 rounded-full border border-zinc-200 bg-white flex items-center justify-center font-bold text-[10px]">
                          3 of 3
                        </div>
                        <span className="text-[9px] text-zinc-500 mt-1">Proof</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Screen 4: Mobile Take Viewer matching PDF Page 4 */}
                {activeScreen === "viewer" && (
                  <div className="flex-1 flex flex-col bg-zinc-950 text-white pb-16">
                    {/* Top Stories Progress Bar */}
                    <div className="px-4 pt-3 pb-1 flex items-center gap-1 pointer-events-none">
                      <div className="flex-1 h-[2px] bg-white/40 rounded-full" />
                      <div className="flex-1 h-[2px] bg-white/40 rounded-full" />
                      <div className="flex-1 h-[2.5px] bg-white rounded-full" />
                      <div className="flex-1 h-[2px] bg-white/40 rounded-full" />
                    </div>

                    {/* Header matching PDF Page 4 */}
                    <div className="px-4 pt-1 pb-2 flex items-center justify-between border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full p-[1.5px] ring-gradient-teal">
                          <div className="w-full h-full rounded-full bg-cyan-400" />
                        </div>
                        <div className="text-xs font-bold text-white">
                          Mira Okonkwo <span className="text-zinc-400 font-normal">Basalt, a fragrance still</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveScreen("feed")}
                        className="p-1 text-zinc-400 hover:text-white cursor-pointer"
                      >
                        <CloseIcon size={16} />
                      </button>
                    </div>

                    {/* Full Canvas Media with Basalt Bottle */}
                    <div className="p-3">
                      <GradientMedia
                        variant="perfume-hero"
                        bottleTitle="Basalt"
                        aspectRatio="aspect-[4/5]"
                        takeLabel={`Take ${currentTake} of 23`}
                        showInteractiveShine
                        showProgressSegments={false}
                      />
                    </div>

                    {/* Interactive Take Scrubber & Prompt from PDF Page 4 */}
                    <div className="px-4 py-2 flex flex-col gap-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-white">Take {currentTake} of 23</span>
                        <span className="text-zinc-400 font-mono text-[10px]">Midjourney</span>
                      </div>

                      {/* Purple Range Slider */}
                      <input
                        type="range"
                        min="1"
                        max="23"
                        value={currentTake}
                        onChange={(e) => setCurrentTake(Number(e.target.value))}
                        className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#7c3aed]"
                      />
                    </div>

                    {/* Prompt Box */}
                    <div className="mx-4 my-1 p-2.5 rounded-xl bg-zinc-900 border border-white/10 text-[10px]">
                      <div className="text-zinc-200 font-mono italic mb-2">
                        &quot;{currentTakeInfo.prompt}&quot;
                      </div>
                      <div className="text-white font-semibold">
                        What changed: <span className="font-normal text-zinc-300">{currentTakeInfo.change}</span>
                      </div>
                    </div>

                    {/* Bottom CTA Button */}
                    <div className="px-4 mt-auto">
                      <button
                        type="button"
                        onClick={() => setIsInviteOpen(true)}
                        className="w-full py-2.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-xs rounded-xl transition-all active:scale-98 cursor-pointer shadow-lg shadow-purple-600/30"
                      >
                        Invite Mira to a brief
                      </button>
                    </div>
                  </div>
                )}

                {/* Bottom App Navigation Bar matching PDF Pages 1-3 */}
                <div className="absolute bottom-0 inset-x-0 h-14 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-around px-2 z-30">
                  <button
                    type="button"
                    onClick={() => setActiveScreen("feed")}
                    className={`flex flex-col items-center justify-center p-1.5 transition-colors cursor-pointer ${
                      activeScreen === "feed"
                        ? "text-purple-600"
                        : "text-zinc-400 hover:text-zinc-700"
                    }`}
                  >
                    <HomeIcon size={20} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveScreen("discover")}
                    className={`flex flex-col items-center justify-center p-1.5 transition-colors cursor-pointer ${
                      activeScreen === "discover"
                        ? "text-purple-600"
                        : "text-zinc-400 hover:text-zinc-700"
                    }`}
                  >
                    <SearchIcon size={20} />
                  </button>

                  {/* Center Vibrant Gradient Plus Pill from PDF */}
                  <button
                    type="button"
                    onClick={() => setIsInviteOpen(true)}
                    className="flex items-center justify-center p-2 rounded-2xl bg-gradient-to-tr from-rose-500 via-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/30 transform -translate-y-1 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    <PostBriefIcon size={20} className="stroke-[2.5]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setLiked(!liked)}
                    className={`flex flex-col items-center justify-center p-1.5 transition-colors cursor-pointer ${
                      liked ? "text-rose-500" : "text-zinc-400 hover:text-zinc-700"
                    }`}
                  >
                    <HeartIcon size={20} fill={liked ? "currentColor" : "none"} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveScreen("profile")}
                    className={`flex flex-col items-center justify-center p-1.5 transition-colors cursor-pointer ${
                      activeScreen === "profile"
                        ? "text-purple-600"
                        : "text-zinc-400 hover:text-zinc-700"
                    }`}
                  >
                    <UserIcon size={20} />
                  </button>
                </div>
              </div>

              {/* Bottom Home Indicator Bar */}
              <div className="w-32 h-1 bg-zinc-400/60 rounded-full mx-auto mt-2 select-none" />
            </div>
          </div>
        </div>
      )}

      {/* Embedded Communication Modal for inviting creators */}
      {isInviteOpen && (
        <CommunicationModal
          isOpen={isInviteOpen}
          onClose={() => setIsInviteOpen(false)}
          targetCreator={mira}
        />
      )}
    </>
  );
}
