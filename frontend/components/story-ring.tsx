"use client";

import React from "react";
import Link from "next/link";
import { playClickSound } from "@/lib/client/audio";

interface StoryRingProps {
  name: string;
  handle: string;
  avatarUrl?: string;
  initials?: string;
  hasNewWork?: boolean;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  href?: string;
  className?: string;
}

export function StoryRing({
  name,
  handle,
  avatarUrl,
  initials,
  hasNewWork = true,
  size = "md",
  onClick,
  href,
  className = "",
}: StoryRingProps) {
  const sizeClasses = {
    sm: "w-10 h-10 min-w-[40px]",
    md: "w-14 h-14 sm:w-16 sm:h-16 min-w-[56px] sm:min-w-[64px]",
    lg: "w-20 h-20 sm:w-24 sm:h-24 min-w-[80px] sm:min-w-[96px]",
  }[size];

  const label = `${name}, ${hasNewWork ? "new work" : "seen"}`;
  const displayInitials = initials || name.charAt(0);

  const ringStyle = hasNewWork
    ? { background: "var(--gradient-ring)" }
    : { border: "2px solid var(--border)" };

  const content = (
    <div
      className={`aspect-square rounded-full flex items-center justify-center p-[3px] transition-transform duration-150 group-hover:scale-105 ${sizeClasses} ${className}`}
      style={ringStyle}
    >
      {/* 3px white gap */}
      <div className="w-full h-full rounded-full p-[3px] bg-[var(--surface)] flex items-center justify-center overflow-hidden">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="w-full h-full object-cover rounded-full"
          />
        ) : (
          <div className="w-full h-full rounded-full bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center font-bold text-xs sm:text-sm text-[var(--text)]">
            {displayInitials}
          </div>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        onClick={() => {
          playClickSound();
          if (onClick) onClick();
        }}
        className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group select-none min-h-[44px] min-w-[44px]"
        aria-label={label}
      >
        {content}
        <span className="text-xs font-medium text-[var(--text)] text-center line-clamp-1 max-w-[72px]">
          {name.split(" ")[0]}
        </span>
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        playClickSound();
        if (onClick) onClick();
      }}
      className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group select-none min-h-[44px] min-w-[44px]"
      aria-label={label}
    >
      {content}
      <span className="text-xs font-medium text-[var(--text)] text-center line-clamp-1 max-w-[72px]">
        {name.split(" ")[0]}
      </span>
    </button>
  );
}
