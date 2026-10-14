"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Creator } from "@/lib/contract/schemas";
import { CommunicationModal } from "./communication-modal";
import { playClickSound } from "@/lib/client/audio";

interface CreatorActionsProps {
  creator: Creator;
}

export function CreatorActions({ creator }: CreatorActionsProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={`/briefs/new?invited=${creator.handle}`}
          onClick={() => playClickSound()}
          className="px-5 py-2.5 bg-[var(--link-aa)] hover:bg-[var(--link-aa-hover)] text-white font-bold text-xs rounded-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer shadow-xs inline-flex items-center gap-1.5 select-none"
        >
          <span>Invite to a brief</span>
        </Link>

        <button
          type="button"
          onClick={() => {
            playClickSound();
            setShowModal(true);
          }}
          className="px-5 py-2.5 bg-[var(--surface)] hover:bg-[var(--bg)] text-[var(--text)] border border-[var(--border)] font-bold text-xs rounded-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer inline-flex items-center gap-1.5 shadow-xs select-none"
        >
          <span>Message</span>
        </button>
      </div>

      <CommunicationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        targetCreator={creator}
        onSuccess={() => {
          router.push("/messages");
        }}
      />
    </>
  );
}
