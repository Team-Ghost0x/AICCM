"use client";

import { useEffect, useState } from "react";
import { playClickSound, playThemeSound } from "./audio";

export type Theme = "dark" | "light";

const THEME_KEY = "retake_theme_mode_v1";

export function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "dark" || stored === "light") {
      return stored;
    }
    // Default to dark mode for futuristic AI cinema aesthetic
    return "dark";
  } catch {
    return "dark";
  }
}

export function applyTheme(theme: Theme): void {
  if (typeof window === "undefined") return;
  try {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    root.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
    window.dispatchEvent(new CustomEvent("retake-theme-change", { detail: theme }));
  } catch {
    // Ignore storage issues in restricted modes
  }
}

export function toggleTheme(): Theme {
  const current = getInitialTheme();
  const next: Theme = current === "dark" ? "light" : "dark";
  applyTheme(next);
  playThemeSound(next);
  return next;
}

export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme());

  useEffect(() => {
    applyTheme(theme);

    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<Theme>;
      if (customEvent.detail) {
        setTheme(customEvent.detail);
      }
    };

    window.addEventListener("retake-theme-change", handleThemeChange);
    return () => {
      window.removeEventListener("retake-theme-change", handleThemeChange);
    };
  }, [theme]);

  const handleToggle = () => {
    const next = toggleTheme();
    setTheme(next);
  };

  return [theme, handleToggle];
}
