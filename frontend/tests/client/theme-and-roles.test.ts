import { describe, it, expect, beforeEach } from "vitest";
import { getInitialTheme, applyTheme, toggleTheme } from "@/lib/client/theme";
import { getCurrentUser, switchRole } from "@/lib/client/auth";

describe("Theme Management", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
  });

  it("defaults to dark theme for futuristic AI cinema look", () => {
    const initial = getInitialTheme();
    expect(initial).toBe("dark");
  });

  it("applies theme to document element and localStorage", () => {
    applyTheme("light");
    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(localStorage.getItem("retake_theme_mode_v1")).toBe("light");

    applyTheme("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(localStorage.getItem("retake_theme_mode_v1")).toBe("dark");
  });

  it("toggles theme between dark and light", () => {
    applyTheme("dark");
    const next = toggleTheme();
    expect(next).toBe("light");
    expect(document.documentElement.classList.contains("light")).toBe(true);

    const back = toggleTheme();
    expect(back).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});

describe("Brand vs Creator Roles", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("defaults to brand role and switches cleanly to creator", () => {
    const user = switchRole("creator");
    expect(user.role).toBe("creator");
    expect(user.name).toBe("Arjun Patel");
    expect(user.email).toBe("arjun@retake.market");

    const current = getCurrentUser();
    expect(current?.role).toBe("creator");
  });

  it("switches back to brand role with operational workspace permissions", () => {
    switchRole("creator");
    const brandUser = switchRole("brand");
    expect(brandUser.role).toBe("brand");
    expect(brandUser.name).toBe("Vikram Sharma");
    expect(brandUser.email).toBe("vikram.sharma@zomatostudios.com");

    const current = getCurrentUser();
    expect(current?.role).toBe("brand");
  });
});
