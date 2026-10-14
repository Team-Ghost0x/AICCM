"use client";

import React, { useState } from "react";
import { CheckIcon } from "./icons";

interface PipelineNode {
  id: string;
  order: number;
  type: "checkpoint" | "conditioning" | "lora" | "sampler" | "upscale";
  title: string;
  model: string;
  details: string;
  params: Record<string, string | number>;
  verified: boolean;
}

interface NodePipelineGraphProps {
  creatorName: string;
  pieceTitle: string;
}

const DEFAULT_PIPELINE: PipelineNode[] = [
  {
    id: "node-1",
    order: 1,
    type: "checkpoint",
    title: "Base Model Checkpoint",
    model: "Flux.1 Schnell (fp8)",
    details: "High-frequency text comprehension & anatomical coherence",
    params: {
      clip_skip: 1,
      base_res: "1024x1024",
      precision: "fp8_e4m3fn",
    },
    verified: true,
  },
  {
    id: "node-2",
    order: 2,
    type: "lora",
    title: "Cinematic Anamorphic LoRA",
    model: "CinematicLens_v2.5",
    details: "Custom trained horizontal bokeh, rim glare & teal-orange grade",
    params: {
      model_weight: 0.85,
      clip_weight: 0.9,
      trigger: "anamorphic lens flare",
    },
    verified: true,
  },
  {
    id: "node-3",
    order: 3,
    type: "conditioning",
    title: "Prompt Conditioning & ControlNet",
    model: "ControlNet Depth v1.1",
    details: "Structural depth map guiding spatial perspective and rim lighting",
    params: {
      strength: 0.75,
      start_percent: 0.0,
      end_percent: 0.65,
    },
    verified: true,
  },
  {
    id: "node-4",
    order: 4,
    type: "sampler",
    title: "KSampler (Euler Ancestral)",
    model: "Euler A / SGM Uniform",
    details: "Iterative denoising with progressive keyframe latent steering",
    params: {
      steps: 32,
      cfg: 6.5,
      denoise: 1.0,
      seed: "8941209581",
    },
    verified: true,
  },
  {
    id: "node-5",
    order: 5,
    type: "upscale",
    title: "Neural Upscaler & Motion Flow",
    model: "Runway Gen-3 + Topaz 8K",
    details: "Frame interpolation at 60fps with sub-pixel texture regeneration",
    params: {
      scale_factor: "4x",
      target_fps: 60,
      codec: "ProRes 422HQ",
    },
    verified: true,
  },
];

export function NodePipelineGraph({
  creatorName,
  pieceTitle,
}: NodePipelineGraphProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string>("node-4");
  const selectedNode =
    DEFAULT_PIPELINE.find((n) => n.id === selectedNodeId) || DEFAULT_PIPELINE[0];

  return (
    <section className="bg-[#e5e5e5] p-6 md:p-8 border border-[#000000]/15 flex flex-col gap-6 text-left select-none">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#000000]/20 pb-3">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-[#3d3d3d] block">
            Process Telemetry // ComfyUI Pipeline
          </span>
          <h2 className="text-2xl font-bold text-[#000000] tracking-tight mt-1">
            Generative Node Pipeline Graph
          </h2>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px] text-[#000000] bg-[#ffffff] px-2.5 py-1 border border-[#000000]/20">
          <span className="w-2 h-2 rounded-full tally bg-[#0b7a43] animate-pulse inline-block" />
          <span>Verified Workflow Engine</span>
        </div>
      </div>

      <p className="text-xs text-[#3d3d3d] leading-relaxed">
        AI production is not one prompt. Click any node below to inspect the verified parameters, model checkpoints, and latent conditioning stages used by {creatorName} for &ldquo;{pieceTitle}&rdquo;.
      </p>

      {/* Interactive Horizontal Pipeline Ribbon */}
      <div className="overflow-x-auto pb-2">
        <div className="flex items-center gap-2 min-w-[680px]">
          {DEFAULT_PIPELINE.map((node, index) => {
            const isSelected = node.id === selectedNodeId;
            return (
              <React.Fragment key={node.id}>
                <button
                  type="button"
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`flex-1 p-3 text-left border transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? "bg-[#000000] text-[#ffffff] border-[#000000] -translate-y-1"
                      : "bg-[#ffffff] text-[#000000] border-[#000000]/20 hover:border-[#000000] hover:bg-[#f4f4f4]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5 font-mono text-[10px]">
                    <span className={isSelected ? "text-[#e8341c] font-bold" : "text-[#3d3d3d]"}>
                      NODE 0{node.order}
                    </span>
                    {node.verified && (
                      <span className="text-[#0b7a43] font-bold inline-flex items-center gap-0.5">
                        <CheckIcon size={12} strokeWidth={2.5} />
                      </span>
                    )}
                  </div>
                  <strong className="text-xs block line-clamp-1">{node.title}</strong>
                  <span className={`text-[11px] font-mono block mt-1 line-clamp-1 ${isSelected ? "text-[#a1a1aa]" : "text-[#52525b]"}`}>
                    {node.model}
                  </span>
                </button>

                {index < DEFAULT_PIPELINE.length - 1 && (
                  <span className="text-[#000000] font-mono text-xs font-bold px-1 select-none">
                    [--]
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Selected Node Dossier Card */}
      <div className="bg-[#ffffff] p-5 border-2 border-[#000000] flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#000000]/10 pb-3">
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 bg-[#000000] text-[#ffffff] font-mono text-xs font-bold flex items-center justify-center rounded-[2px]">
              0{selectedNode.order}
            </span>
            <div>
              <strong className="text-sm text-[#000000] block">{selectedNode.title}</strong>
              <span className="text-xs font-mono text-[#e8341c] font-bold">{selectedNode.model}</span>
            </div>
          </div>
          <span className="text-[11px] bg-[#e5e5e5] px-2 py-0.5 font-mono text-[#000000] border border-[#000000]/15 w-fit">
            Status: Telemetry Verified
          </span>
        </div>

        <p className="text-xs text-[#000000] leading-relaxed">
          {selectedNode.details}
        </p>

        {/* Node Parameters Grid */}
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#3d3d3d] block mb-2 font-bold">
            Live Node Parameters &amp; Config:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            {Object.entries(selectedNode.params).map(([key, val]) => (
              <div key={key} className="bg-[#f4f4f4] p-2 border border-[#000000]/15">
                <span className="text-[10px] text-[#52525b] uppercase block">{key.replace("_", " ")}</span>
                <strong className="text-xs text-[#000000] mt-0.5 block truncate">{String(val)}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
