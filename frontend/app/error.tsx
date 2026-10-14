"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { HomeIcon } from "@/components/icons";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log client error for debugging
    console.error("Runtime error caught by error boundary:", error);
  }, [error]);

  return (
    <div className="w-full min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 max-w-lg mx-auto text-center">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 flex items-center justify-center text-2xl mb-4 text-rose-600 dark:text-rose-400">
        ⚠️
      </div>
      <h1 className="text-2xl font-black text-[var(--text)] tracking-tight">
        Something went wrong
      </h1>
      <p className="text-sm text-[var(--text-secondary-aa)] mt-2 leading-relaxed">
        An unexpected error occurred while rendering this view. You can retry or head back to the marketplace home.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
        <button
          type="button"
          onClick={() => reset()}
          className="px-5 py-2.5 bg-[var(--link-aa)] hover:bg-[var(--link-aa-hover)] text-white text-xs font-bold rounded-xl shadow-xs transition-transform hover:scale-105 active:scale-95 cursor-pointer"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="px-5 py-2.5 bg-[var(--surface)] hover:bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] text-xs font-bold rounded-xl transition-colors flex items-center gap-2"
        >
          <HomeIcon size={14} />
          <span>Go to Home</span>
        </Link>
      </div>
    </div>
  );
}
