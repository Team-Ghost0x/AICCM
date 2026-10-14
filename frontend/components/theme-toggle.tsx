"use client";

import React from "react";
import { useTheme } from "@/lib/client/theme";
import { SunIcon, MoonIcon } from "./icons";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, toggle] = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
      className={`relative inline-flex items-center justify-center p-2 rounded-[3px] border transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0.5 active:scale-95 cursor-pointer ${
        theme === "dark"
          ? "bg-[#18181b] text-[#ffffff] border-[#3f3f46] hover:bg-[#27272a] hover:border-[#71717a]"
          : "bg-[#ffffff] text-[#09090b] border-[#000000]/25 hover:bg-[#e4e4e7] hover:border-[#000000]"
      } ${className}`}
    >
      {theme === "dark" ? (
        <SunIcon size={16} className="text-[#fbbf24] transition-transform duration-200 hover:rotate-45" />
      ) : (
        <MoonIcon size={16} className="text-[#09090b] transition-transform duration-200 hover:-rotate-12" />
      )}
    </button>
  );
}
