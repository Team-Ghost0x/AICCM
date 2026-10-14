"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Creator, PortfolioPiece } from "@/lib/contract/schemas";
import { CheckIcon, BookmarkIcon, HeartIcon, ShareIcon, MessageIcon } from "./icons";
import { playClickSound } from "@/lib/client/audio";
import { getCurrentUser } from "@/lib/client/auth";
import { saveCreatorToShortlist, removeCreatorFromShortlist } from "@/lib/client/api";

interface GigCardProps {
  creator: Creator;
  onHire?: (creator: Creator) => void;
  className?: string;
  isSaved?: boolean;
  onSaveToggle?: (creatorId: string, saved: boolean) => void;
}

export function GigCard({ creator, onHire, className = "", isSaved: propIsSaved, onSaveToggle }: GigCardProps) {
  const [user, setUser] = useState(() => getCurrentUser());
  const [internalSaved, setInternalSaved] = useState(propIsSaved ?? false);
  const isSaved = propIsSaved !== undefined ? propIsSaved : internalSaved;
  const [isSaving, setIsSaving] = useState(false);

  const pieces: PortfolioPiece[] = creator.portfolio && creator.portfolio.length > 0 ? creator.portfolio : [];
  const [activePieceIndex, setActivePieceIndex] = useState(0);

  const activePiece = pieces[activePieceIndex] || pieces[0];
  const isToolsVerified =
    creator.verification?.tools === "evidence_attached" ||
    creator.verification?.tools === "reviewed";

  const cardTitle = activePiece?.title || creator.headline;
  const deliveryDays = creator.turnaroundDays || 4;
  const startingPrice = creator.priceFromInr || 25000;
  const toolsToShow = creator.tools.slice(0, 3);

  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(148);

  const handleSaveClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    playClickSound();

    if (!user) {
      alert("Please sign in as a Brand to save creators to your shortlist.");
      return;
    }

    setIsSaving(true);
    const nextSaved = !isSaved;
    setInternalSaved(nextSaved);

    try {
      if (nextSaved) {
        await saveCreatorToShortlist(creator.id);
      } else {
        await removeCreatorFromShortlist(creator.id);
      }
      onSaveToggle?.(creator.id, nextSaved);
    } catch {
      setInternalSaved(!nextSaved);
    } finally {
      setIsSaving(false);
    }
  };

  const handleHireClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    playClickSound();
    if (onHire) {
      onHire(creator);
    } else {
      window.location.href = `/briefs/new?invited=${creator.handle}`;
    }
  };

  return (
    <article
      className={`group relative bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden flex flex-col transition-all duration-200 hover:border-[var(--control-border)] shadow-xs ${className}`}
    >
      {/* 1. Meta Post Header: Avatar with story gradient ring + Creator Details + Shortlist */}
      <div className="p-3 sm:p-3.5 flex items-center justify-between gap-2.5 border-b border-[var(--border)]/60 bg-[var(--surface)]">
        <Link
          href={`/creators/${creator.handle}`}
          className="flex items-center gap-2.5 min-w-0 group/creator"
        >
          {/* Instagram Story Gradient Ring Avatar */}
          <div className="w-9 h-9 rounded-full p-[2px] bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] shrink-0">
            <div className="w-full h-full rounded-full bg-[var(--surface)] p-[1.5px] overflow-hidden flex items-center justify-center">
              {creator.avatarUrl ? (
                <img src={creator.avatarUrl} alt={creator.displayName} className="w-full h-full object-cover rounded-full" />
              ) : (
                <div className="w-full h-full rounded-full bg-[var(--gradient-text-safe)] text-white text-xs font-bold flex items-center justify-center">
                  {creator.displayName.charAt(0)}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-[var(--text)] group-hover/creator:text-[var(--link-aa)] transition-colors truncate">
                {creator.displayName}
              </span>
              <span className="w-3.5 h-3.5 rounded-full bg-[#0095F6] text-white flex items-center justify-center shrink-0">
                <CheckIcon size={9} strokeWidth={2.5} />
              </span>
            </div>
            <span className="text-[11px] text-[var(--text-secondary-aa)] truncate">
              @{creator.handle} · {creator.specializations?.[0] || "AI Creator"}
            </span>
          </div>
        </Link>

        {/* Shortlist Bookmark Button */}
        <button
          type="button"
          onClick={handleSaveClick}
          disabled={isSaving}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            isSaved
              ? "text-[var(--link-aa)] bg-[var(--bg)]"
              : "text-[var(--text-secondary-aa)] hover:text-[var(--text)] hover:bg-[var(--bg)]"
          }`}
          title={isSaved ? "Saved to shortlist" : "Save to shortlist"}
          aria-label={isSaved ? "Remove from shortlist" : "Save to shortlist"}
        >
          <BookmarkIcon size={18} fill={isSaved ? "currentColor" : "none"} />
        </button>
      </div>

      {/* 2. Post Media Canvas (4:5 Aspect Ratio, object-fit: cover) */}
      <Link
        href={`/creators/${creator.handle}`}
        className="block relative w-full aspect-[4/5] bg-[#121212] overflow-hidden select-none"
        aria-label={`View ${creator.displayName}'s portfolio: ${cardTitle}`}
      >
        {activePiece?.posterUrl || activePiece?.mediaUrl ? (
          <img
            src={activePiece.posterUrl || activePiece.mediaUrl}
            alt={activePiece.title || creator.headline}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          /* Clean Minimal Studio Dark Fallback */
          <div className="w-full h-full bg-[#18181b] flex flex-col items-center justify-center p-6 text-white text-center">
            <span className="text-xs font-mono uppercase tracking-widest text-[#a1a1aa] mb-2">
              {activePiece?.contentType || "AI Motion Master"}
            </span>
            <strong className="text-sm font-semibold line-clamp-2 text-white">
              {cardTitle}
            </strong>
          </div>
        )}

        {/* Verified Tools Badge (Top Left Pill) */}
        {isToolsVerified && (
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 bg-black/70 backdrop-blur-md text-white border border-white/20 rounded-full text-[11px] font-semibold shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Verified Stack</span>
          </div>
        )}

        {/* Carousel Dots if multiple pieces */}
        {pieces.length > 1 && (
          <div
            className="absolute bottom-3 inset-x-0 z-10 flex items-center justify-center gap-1.5 pointer-events-auto"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            {pieces.slice(0, 5).map((p, idx) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setActivePieceIndex(idx)}
                aria-label={`View portfolio piece ${idx + 1}`}
                className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${
                  activePieceIndex === idx
                    ? "w-3 bg-white shadow-xs"
                    : "bg-white/60 hover:bg-white"
                }`}
              />
            ))}
          </div>
        )}
      </Link>

      {/* 3. Meta Action Bar: Like / Comment / Share / Save */}
      <div className="px-3.5 pt-3 pb-1 flex items-center justify-between text-[var(--text)]">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              playClickSound();
              setIsLiked(!isLiked);
              setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
            }}
            className="hover:opacity-70 transition-opacity cursor-pointer"
            aria-label={isLiked ? "Unlike post" : "Like post"}
          >
            <HeartIcon
              size={20}
              className={isLiked ? "text-rose-500" : "text-[var(--text)]"}
              fill={isLiked ? "currentColor" : "none"}
            />
          </button>
          <Link
            href={`/creators/${creator.handle}`}
            className="hover:opacity-70 transition-opacity"
            aria-label="Direct message or discuss brief"
          >
            <MessageIcon size={20} />
          </Link>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              playClickSound();
              if (typeof navigator !== "undefined" && navigator.share) {
                navigator.share({ title: cardTitle, url: window.location.origin + `/creators/${creator.handle}` }).catch(() => {});
              }
            }}
            className="hover:opacity-70 transition-opacity cursor-pointer"
            aria-label="Share creator piece"
          >
            <ShareIcon size={19} />
          </button>
        </div>
        <span className="text-[11px] font-semibold text-[var(--text-secondary-aa)]">
          {likeCount.toLocaleString()} likes
        </span>
      </div>

      {/* 4. Caption, Hashtags & Pricing */}
      <div className="px-3.5 pb-3.5 pt-1 flex flex-col gap-2 flex-1 justify-between">
        <div className="flex flex-col gap-1.5">
          <Link
            href={`/creators/${creator.handle}`}
            className="text-xs font-semibold text-[var(--text)] leading-snug line-clamp-2 hover:text-[var(--link-aa)] transition-colors"
          >
            <span className="font-bold mr-1.5">{creator.handle}</span>
            <span className="font-normal text-[var(--text-secondary-aa)]">{cardTitle}</span>
          </Link>

          {/* Instagram-style Hashtag Tool Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {toolsToShow.map((tool) => (
              <span
                key={tool.toolId}
                className="text-[11px] font-medium text-[var(--link-aa)] hover:underline cursor-pointer"
              >
                #{tool.name.replace(/\s+/g, "")}
              </span>
            ))}
          </div>
        </div>

        {/* 5. Delivery Time, Price & Meta Action Buttons */}
        <div className="pt-2.5 mt-1 border-t border-[var(--border)] flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-[11px] text-[var(--text-secondary-aa)] font-medium">
              {deliveryDays}-day delivery
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xs text-[var(--text-secondary-aa)]">From</span>
              <strong className="text-sm sm:text-base font-bold text-[var(--text)] tabular-numbers">
                ₹{startingPrice.toLocaleString("en-IN")}
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Link
              href={`/creators/${creator.handle}`}
              className="px-3 py-1.5 min-h-[34px] bg-[var(--surface)] hover:bg-[var(--bg)] text-[var(--text)] text-xs font-semibold rounded-lg transition-colors flex items-center justify-center border border-[var(--border)] shadow-xs"
            >
              Profile
            </Link>
            <button
              type="button"
              onClick={handleHireClick}
              className="px-3.5 py-1.5 min-h-[34px] bg-[var(--link-aa)] hover:bg-[var(--link-aa-hover)] text-white text-xs font-bold rounded-lg transition-transform duration-150 hover:scale-105 active:scale-95 cursor-pointer shadow-xs select-none"
              aria-label={`Hire ${creator.displayName} starting from ₹${startingPrice.toLocaleString("en-IN")}`}
            >
              Invite
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export function GigCardSkeleton() {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden flex flex-col animate-pulse">
      <div className="p-3.5 flex items-center gap-2.5 border-b border-[var(--border)]">
        <div className="w-9 h-9 rounded-full bg-[var(--border)]" />
        <div className="flex flex-col gap-1 flex-1">
          <div className="w-24 h-3 bg-[var(--border)] rounded" />
          <div className="w-16 h-2.5 bg-[var(--border)] rounded" />
        </div>
      </div>
      <div className="w-full aspect-[4/5] bg-[var(--border)]" />
      <div className="p-3.5 flex flex-col gap-2.5 flex-1">
        <div className="w-full h-4 bg-[var(--border)] rounded" />
        <div className="w-3/4 h-3.5 bg-[var(--border)] rounded" />
        <div className="flex gap-1.5 mt-1">
          <div className="w-12 h-3.5 bg-[var(--border)] rounded" />
          <div className="w-14 h-3.5 bg-[var(--border)] rounded" />
        </div>
        <div className="pt-2.5 mt-2 border-t border-[var(--border)] flex justify-between items-center">
          <div className="w-16 h-4 bg-[var(--border)] rounded" />
          <div className="w-16 h-8 bg-[var(--border)] rounded-lg" />
        </div>
      </div>
    </div>
  );
}
