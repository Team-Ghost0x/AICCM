import React from "react";
import Link from "next/link";
import { HomeIcon, SearchIcon, ArrowIcon } from "@/components/icons";

export default function NotFound() {
  return (
    <div className="w-full min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 max-w-lg mx-auto text-center">
      <div className="w-20 h-20 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mb-5 shadow-xs">
        <span
          className="text-3xl font-black"
          style={{
            background: "var(--gradient-primary)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          404
        </span>
      </div>
      <h1 className="text-2xl sm:text-3xl font-black text-[var(--text)] tracking-tight">
        Page Not Found
      </h1>
      <p className="text-sm text-[var(--text-secondary-aa)] mt-2.5 leading-relaxed">
        The page or creator resource you were looking for doesn&apos;t exist or has moved. Explore verified creators or head back home.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
        <Link
          href="/"
          className="px-5 py-2.5 bg-[var(--link-aa)] hover:bg-[var(--link-aa-hover)] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
        >
          <HomeIcon size={14} />
          <span>Go to Home</span>
        </Link>
        <Link
          href="/discover"
          className="px-5 py-2.5 bg-[var(--surface)] hover:bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] text-xs font-bold rounded-xl transition-colors flex items-center gap-2"
        >
          <SearchIcon size={14} />
          <span>Find Creators</span>
        </Link>
      </div>
    </div>
  );
}
