"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { MessagesInbox } from "@/components/messages-inbox";
import { getCurrentUser, User, onAuthChange } from "@/lib/client/auth";

export default function MessagesPage() {
  const [user, setUser] = useState<User | null>(() => getCurrentUser());

  useEffect(() => {
    const unsub = onAuthChange((u) => setUser(u));
    return () => unsub();
  }, []);

  const isBrand = user?.role === "brand";
  const isAdmin = user?.role === "admin";

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 md:px-10 py-6 md:py-10 text-left">
      {/* Header Banner */}
      <div className="border-b border-[var(--border)] pb-6 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--link-aa)] inline-block" />
            <span className="font-mono text-xs uppercase tracking-widest text-[var(--text-secondary-aa)] font-bold">
              Marketplace Communications // {isAdmin ? "ADMIN MONITOR" : isBrand ? "BRAND INBOX" : "CREATOR WORKSPACE"}
            </span>

            {/* Authenticated Persona Badge (Read-Only) */}
            {user && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--surface-sunken)] border border-[var(--border)] text-[var(--text)] ml-2">
                <span className={`w-1.5 h-1.5 rounded-full ${isAdmin ? "bg-amber-500" : isBrand ? "bg-indigo-500" : "bg-sky-500"}`} />
                <span className="capitalize">{user.role}</span>
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-[var(--text)] tracking-tight">
            Direct Communications &amp; Proposals
          </h1>
          <p className="text-xs text-[var(--text-secondary-aa)] mt-1 font-mono">
            Bidirectional collaboration hub for brands, creative agencies, and generative content creators.
          </p>
        </div>

        {/* Quick Nav */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="bg-[var(--surface)] hover:bg-[var(--surface-sunken)] text-[var(--text)] font-bold text-xs px-4 py-2.5 rounded-xl border border-[var(--border)] transition-colors shadow-xs"
          >
            Dashboard
          </Link>
          {isBrand && (
            <Link
              href="/discover"
              className="bg-[var(--text)] hover:opacity-90 text-[var(--bg)] font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-xs"
            >
              Find Creators
            </Link>
          )}
        </div>
      </div>

      {/* Main Messages Suite */}
      <MessagesInbox roleFilter={user?.role} />
    </div>
  );
}
