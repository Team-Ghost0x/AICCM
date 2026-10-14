"use client";

import React, { useState } from "react";

interface MiniSparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  className?: string;
}

export function MiniSparkline({
  data,
  color = "#0b7a43",
  width = 120,
  height = 36,
  className = "",
}: MiniSparklineProps) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 4;

  const points = data.map((val, idx) => {
    const x = padding + (idx / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((val - min) / range) * (height - padding * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = `M ${points.join(" L ")}`;
  const lastPoint = points[points.length - 1].split(",");

  return (
    <div className={`inline-block overflow-hidden ${className}`}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-all duration-300"
        />
        {/* Pulsing endpoint dot */}
        <circle
          cx={Number(lastPoint[0])}
          cy={Number(lastPoint[1])}
          r="3"
          fill={color}
          className="animate-ping"
          opacity="0.7"
        />
        <circle
          cx={Number(lastPoint[0])}
          cy={Number(lastPoint[1])}
          r="3"
          fill={color}
        />
      </svg>
    </div>
  );
}

interface PerformanceChartProps {
  dataSeries?: Record<string, { label: string; value: number }[]>;
  title?: string;
}

const DEFAULT_SERIES: Record<string, { label: string; value: number }[]> = {
  "1D": [
    { label: "00:00", value: 4800 },
    { label: "04:00", value: 5050 },
    { label: "08:00", value: 4950 },
    { label: "12:00", value: 5280 },
    { label: "16:00", value: 5427 },
    { label: "20:00", value: 5390 },
  ],
  "1W": [
    { label: "Mon", value: 4500 },
    { label: "Tue", value: 4720 },
    { label: "Wed", value: 4600 },
    { label: "Thu", value: 5100 },
    { label: "Fri", value: 5350 },
    { label: "Sat", value: 5427 },
    { label: "Sun", value: 5490 },
  ],
  "1M": [
    { label: "Day 3", value: 4834 },
    { label: "Day 6", value: 5084 },
    { label: "Day 9", value: 4620 },
    { label: "Day 12", value: 4100 },
    { label: "Day 15", value: 4950 },
    { label: "Day 18", value: 5380 },
    { label: "Day 21", value: 4700 },
    { label: "Day 24", value: 5334 },
    { label: "Day 28", value: 5427 },
  ],
  "1Y": [
    { label: "Q1", value: 2400 },
    { label: "Q2", value: 3600 },
    { label: "Q3", value: 4800 },
    { label: "Q4", value: 5427 },
  ],
  ALL: [
    { label: "2024", value: 1200 },
    { label: "2025", value: 3100 },
    { label: "2026", value: 5427 },
  ],
};

export function PerformanceChart({
  dataSeries = DEFAULT_SERIES,
  title = "Campaign Volume & Pipeline Performance",
}: PerformanceChartProps) {
  const [activeRange, setActiveRange] = useState<string>("1M");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const series = dataSeries[activeRange] || dataSeries["1M"] || [];
  const minVal = Math.min(...series.map((d) => d.value));
  const maxVal = Math.max(...series.map((d) => d.value));
  const rangeVal = maxVal - minVal || 1;

  const width = 640;
  const height = 220;
  const paddingX = 36;
  const paddingY = 24;

  const coords = series.map((item, idx) => {
    const x = paddingX + (idx / (series.length - 1)) * (width - paddingX * 2);
    const y = height - paddingY - ((item.value - minVal) / rangeVal) * (height - paddingY * 2);
    return { x, y, ...item };
  });

  const polylinePoints = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");

  const activePoint = hoveredIndex !== null ? coords[hoveredIndex] : coords[coords.length - 1];

  return (
    <div className="bg-[#000000] text-[#ffffff] p-6 border-2 border-[#000000] select-none text-left">
      {/* Top Header with Live Value & Time Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#3d3d3d] pb-4 mb-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#b9b9b9] block">
            {title}
          </span>
          <div className="flex items-baseline gap-3 mt-1">
            <span className="text-3xl font-black text-[#ffffff] tabular-numbers tracking-tight">
              ₹{(activePoint?.value * 100).toLocaleString("en-IN")}
            </span>
            <span className="text-xs font-bold text-[#0b7a43] bg-[#0b7a43]/20 px-2 py-0.5 rounded-[2px] tabular-numbers">
              +8.16%
            </span>
            <span className="text-[11px] text-[#b9b9b9] font-mono">
              {activePoint?.label}
            </span>
          </div>
        </div>

        {/* Time Interval Pills */}
        <div className="inline-flex bg-[#161616] p-1 border border-[#3d3d3d] rounded-[3px] self-start sm:self-auto">
          {Object.keys(dataSeries).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                setActiveRange(r);
                setHoveredIndex(null);
              }}
              className={`text-xs px-2.5 py-1 font-mono font-bold transition-all duration-150 cursor-pointer ${
                activeRange === r
                  ? "bg-[#ffffff] text-[#000000]"
                  : "text-[#b9b9b9] hover:text-[#ffffff]"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive SVG Chart Canvas */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible cursor-crosshair"
        >
          {/* Subtle Grid Lines */}
          <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="#222222" strokeDasharray="3 3" />
          <line x1={paddingX} y1={height / 2} x2={width - paddingX} y2={height / 2} stroke="#222222" strokeDasharray="3 3" />
          <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="#3d3d3d" />

          {/* Connected Polyline Curve */}
          <polyline
            points={polylinePoints}
            fill="none"
            stroke="#0b7a43"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-300"
          />

          {/* Interactive Data Points */}
          {coords.map((pt, idx) => (
            <g
              key={idx}
              onMouseEnter={() => setHoveredIndex(idx)}
              className="cursor-pointer"
            >
              <circle
                cx={pt.x}
                cy={pt.y}
                r={hoveredIndex === idx ? "6" : "3.5"}
                fill={hoveredIndex === idx ? "#ffffff" : "#0b7a43"}
                stroke="#000000"
                strokeWidth="2"
                className="transition-all duration-150"
              />
              {/* Invisible large hover hit target */}
              <circle cx={pt.x} cy={pt.y} r="16" fill="transparent" />
            </g>
          ))}
        </svg>

        {/* X Axis Labels */}
        <div className="flex justify-between items-center text-[10px] font-mono text-[#b9b9b9] mt-2 px-6">
          {coords.map((c, i) => (
            <span key={i} className={hoveredIndex === i ? "text-[#ffffff] font-bold" : ""}>
              {c.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
