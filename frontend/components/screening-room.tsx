"use client";

import React, { useState } from "react";
import { PortfolioPiece } from "@/lib/contract/schemas";
import { TakeScrubber } from "./take-scrubber";
import { MediaFrame } from "./media-frame";
import { playClickSound } from "@/lib/client/audio";

interface ScreeningRoomProps {
  portfolio: PortfolioPiece[];
  initialPieceId?: string;
}

export function ScreeningRoom({
  portfolio,
  initialPieceId,
}: ScreeningRoomProps) {
  const [selectedPieceId, setSelectedPieceId] = useState(
    initialPieceId || portfolio[0]?.id
  );

  const activePiece =
    portfolio.find((p) => p.id === selectedPieceId) || portfolio[0];

  if (!activePiece) {
    return (
      <section className="w-full bg-[#000000] text-[#ffffff] py-16 px-6 text-center">
        <p className="text-sm text-[#b9b9b9]">No portfolio pieces to screen.</p>
      </section>
    );
  }

  return (
    <section className="w-full bg-[#000000] text-[#ffffff] py-12 md:py-16 my-8 select-none">
      <div className="max-w-[1360px] mx-auto px-6 md:px-12 flex flex-col gap-8">
        {/* Screening Room Bar with animated studio VU meter */}
        <div className="flex items-center justify-between border-b border-[#3d3d3d] pb-4">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full tally bg-[#e8341c] animate-tally-blink inline-block" />
            <h2 className="text-xs uppercase tracking-widest font-mono text-[#b9b9b9] flex items-center gap-3">
              <span>Screening Room // Iteration Study</span>
              {/* Studio Equalizer Bars */}
              <span className="flex items-end gap-[3px] h-3.5">
                <span className="w-[3px] bg-[#e8341c] animate-vu-1 inline-block" />
                <span className="w-[3px] bg-[#e8341c] animate-vu-2 inline-block" />
                <span className="w-[3px] bg-[#e8341c] animate-vu-3 inline-block" />
                <span className="w-[3px] bg-[#e8341c] animate-vu-4 inline-block" />
              </span>
            </h2>
          </div>
          <div className="text-xs text-[#b9b9b9] tabular-numbers font-mono flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full status bg-[#0b7a43] inline-block animate-pulse" />
            <span>{portfolio.length} piece{portfolio.length > 1 ? "s" : ""} in reel</span>
          </div>
        </div>

        {/* Main Screening Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Scrubber Cinema Screen (7 cols) */}
          <div className="lg:col-span-7 bg-[#000000]">
            <TakeScrubber piece={activePiece} />
          </div>

          {/* Piece Dossier & Filmstrip Switcher (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6 text-left">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-[#e8341c]">
                {activePiece.contentType} · {activePiece.aspectRatio}
              </span>
              <h3 className="text-3xl font-black tracking-tight text-[#ffffff] mt-1">
                {activePiece.title}
              </h3>
              <p className="text-sm text-[#b9b9b9] mt-2 leading-relaxed">
                {activePiece.description}
              </p>
            </div>

            {/* Metrics with tactile hover cards */}
            <div className="grid grid-cols-2 gap-4 py-3 border-y border-[#3d3d3d] text-xs">
              <div className="bg-[#141414] hover:bg-[#1f1f1f] border border-[#3d3d3d] p-3 transition-colors duration-200">
                <span className="text-[#b9b9b9] block font-mono text-[11px] uppercase">Generations</span>
                <span className="text-xl font-black text-[#ffffff] tabular-numbers mt-0.5 block">
                  {activePiece.takesCount} takes
                </span>
              </div>
              <div className="bg-[#141414] hover:bg-[#1f1f1f] border border-[#3d3d3d] p-3 transition-colors duration-200">
                <span className="text-[#b9b9b9] block font-mono text-[11px] uppercase">Time Invested</span>
                <span className="text-xl font-black text-[#ffffff] tabular-numbers mt-0.5 block">
                  {activePiece.hoursSpent || 8} hours
                </span>
              </div>
            </div>

            {/* Filmstrip Reel Switcher with hover zooms */}
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#b9b9b9] block mb-3 font-mono">
                Project Filmstrip Reel // Click to screen
              </span>
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {portfolio.map((p) => {
                  const isCurrent = p.id === activePiece.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        playClickSound();
                        setSelectedPieceId(p.id);
                      }}
                      className={`flex-shrink-0 w-[115px] text-left focus:outline-none transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 ${
                        isCurrent
                          ? "ring-2 ring-[#e8341c] scale-102"
                          : "opacity-60 hover:opacity-100"
                      }`}
                    >
                      <div className="h-[75px] w-full bg-[#1e1e1e] overflow-hidden border border-[#3d3d3d]">
                        <MediaFrame
                          src={p.mediaUrl}
                          ratio={p.aspectRatio}
                          alt={p.title}
                          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                        />
                      </div>
                      <span className="block text-[11px] font-bold text-[#ffffff] truncate mt-1">
                        {p.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
