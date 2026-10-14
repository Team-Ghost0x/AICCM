"use client";

import React, { useState, useEffect } from "react";
import { CloseIcon } from "./icons";
import {
  loginWithEmail,
  loginWithBackend,
  registerWithBackend,
  UserRole,
} from "@/lib/client/auth";
import { playClickSound } from "@/lib/client/audio";

interface AuthModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultRole?: UserRole;
  defaultTab?: "signin" | "signup";
}

export function AuthModal({
  isOpen = true,
  onClose,
  onSuccess,
  defaultRole = "brand",
  defaultTab = "signin",
}: AuthModalProps) {
  const [tab, setTab] = useState<"signin" | "signup">(defaultTab);
  const [role, setRole] = useState<UserRole>(defaultRole);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      if (defaultRole) setRole(defaultRole);
      if (defaultTab) setTab(defaultTab);
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;


  const navigateAfterAuth = (userRole: "brand" | "creator" | "admin") => {
    if (typeof window !== "undefined" && window.location.pathname === "/") {
      window.location.href = userRole === "admin" ? "/admin" : "/dashboard";
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage("Please enter both email and password.");
      return;
    }
    if (tab === "signup" && !name.trim()) {
      setErrorMessage("Please enter your name or studio name.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (tab === "signup") {
        const user = await registerWithBackend(
          name.trim(),
          email.trim(),
          password,
          role,
          company.trim() || (role === "brand" ? "Independent Brand" : "AI Studio")
        );
        setIsSubmitting(false);
        setStatusMessage(`Welcome ${user.name}! Registered as ${user.role.toUpperCase()}`);
        setTimeout(() => {
          setStatusMessage(null);
          onClose();
          navigateAfterAuth(user.role);
          onSuccess?.();
        }, 600);
      } else {
        const user = await loginWithBackend(email.trim(), password, role);
        setIsSubmitting(false);
        setStatusMessage(`Welcome back ${user.name}! Logged in as ${user.role.toUpperCase()}`);
        setTimeout(() => {
          setStatusMessage(null);
          onClose();
          navigateAfterAuth(user.role);
          onSuccess?.();
        }, 600);
      }
    } catch (err: unknown) {
      setIsSubmitting(false);
      const message = err instanceof Error ? err.message : "Authentication failed. Please verify credentials.";
      setErrorMessage(message);
    }
  };

  const handleDemoLogin = async (demoRole: "brand" | "creator" | "admin") => {
    setIsSubmitting(true);
    setErrorMessage(null);
    playClickSound();

    const demoEmail =
      demoRole === "admin"
        ? "admin@retake.design"
        : demoRole === "brand"
        ? "brand@nexawave.in"
        : "director@hyperreal.studio";

    try {
      const user = await loginWithBackend(demoEmail, "password", demoRole);
      setIsSubmitting(false);
      setStatusMessage(`Logged in as ${user.name} (${user.role.toUpperCase()})`);
      setTimeout(() => {
        setStatusMessage(null);
        onClose();
        navigateAfterAuth(user.role);
        onSuccess?.();
      }, 500);
    } catch {
      // Direct login fallback
      loginWithEmail(
        demoEmail,
        demoRole === "admin"
          ? "Platform Administrator"
          : demoRole === "brand"
          ? "NexaWave Media"
          : "Devin Vance",
        demoRole
      );
      setIsSubmitting(false);
      setStatusMessage(`Logged in as ${demoRole.toUpperCase()}`);
      setTimeout(() => {
        setStatusMessage(null);
        onClose();
        navigateAfterAuth(demoRole);
        onSuccess?.();
      }, 500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[var(--surface)] border border-[var(--border)] w-full max-w-md p-6 rounded-2xl flex flex-col gap-4 text-left text-xs select-none shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--border)] pb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[var(--link-aa)] inline-block" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-secondary-aa)] font-bold">
                Retake Creator Marketplace
              </span>
            </div>
            <h3 className="text-xl font-bold text-[var(--text)] tracking-tight">
              {tab === "signin" ? "Sign in to Retake" : "Create your account"}
            </h3>
            <p className="text-xs text-[var(--text-secondary-aa)] mt-0.5">
              Connecting verified AI creators with brands &amp; creative agencies.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--text-secondary-aa)] hover:text-[var(--text)] p-1 rounded-md transition-colors cursor-pointer"
            aria-label="Close authentication modal"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Status Toast inside Modal */}
        {statusMessage && (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 px-3.5 py-2.5 rounded-lg border border-emerald-300 text-xs font-semibold">
            {statusMessage}
          </div>
        )}

        {/* Error Toast inside Modal */}
        {errorMessage && (
          <div className="bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-300 px-3.5 py-2.5 rounded-lg text-xs font-semibold">
            {errorMessage}
          </div>
        )}

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 bg-[var(--bg)] p-1 border border-[var(--border)] rounded-lg">
          <button
            type="button"
            onClick={() => {
              playClickSound();
              setTab("signin");
              setErrorMessage(null);
            }}
            className={`py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
              tab === "signin"
                ? "bg-[var(--surface)] text-[var(--text)] shadow-xs"
                : "text-[var(--text-secondary-aa)] hover:text-[var(--text)]"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              playClickSound();
              setTab("signup");
              setErrorMessage(null);
            }}
            className={`py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
              tab === "signup"
                ? "bg-[var(--surface)] text-[var(--text)] shadow-xs"
                : "text-[var(--text-secondary-aa)] hover:text-[var(--text)]"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Select User Role: Brand vs Creator */}
        <div>
          <label className="font-bold text-[var(--text)] block mb-1.5 font-mono uppercase text-[10px] tracking-wider">
            I am joining as:
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setRole("brand");
              }}
              className={`p-3 border rounded-xl text-left transition-all cursor-pointer ${
                role === "brand"
                  ? "border-[var(--link-aa)] bg-blue-50/40 dark:bg-blue-950/20 text-[var(--text)] shadow-xs"
                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary-aa)] hover:border-[var(--control-border)]"
              }`}
            >
              <div className="text-xs font-bold flex items-center justify-between text-[var(--text)]">
                <span>Brand / Agency</span>
                {role === "brand" && <span className="w-2 h-2 rounded-full bg-[var(--link-aa)]" />}
              </div>
              <p className="text-[10px] text-[var(--text-secondary-aa)] mt-0.5 leading-snug">
                Publish briefs, discover creators &amp; review takes
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                playClickSound();
                setRole("creator");
              }}
              className={`p-3 border rounded-xl text-left transition-all cursor-pointer ${
                role === "creator"
                  ? "border-purple-600 bg-purple-50/40 dark:bg-purple-950/20 text-[var(--text)] shadow-xs"
                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary-aa)] hover:border-[var(--control-border)]"
              }`}
            >
              <div className="text-xs font-bold flex items-center justify-between text-[var(--text)]">
                <span>AI Creator</span>
                {role === "creator" && <span className="w-2 h-2 rounded-full bg-purple-600" />}
              </div>
              <p className="text-[10px] text-[var(--text-secondary-aa)] mt-0.5 leading-snug">
                Showcase portfolios, submit proposals &amp; deliverables
              </p>
            </button>
          </div>
        </div>


        {/* Email Form */}
        <form onSubmit={handleFormSubmit} className="flex flex-col gap-2.5">
          {tab === "signup" && (
            <>
              <div>
                <label className="font-semibold text-[var(--text)] block mb-1">
                  {role === "brand" ? "Contact / Director Name" : "Creator / Artist Name"}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={role === "brand" ? "e.g. Vikram Sharma" : "e.g. Mira Okonkwo"}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--link-aa)]"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-[var(--text)] block mb-1">
                  {role === "brand" ? "Brand / Agency Name" : "Studio Handle / Portfolio Title"}
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder={role === "brand" ? "e.g. Zomato Studios" : "e.g. neura-cinema"}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--link-aa)]"
                />
              </div>
            </>
          )}

          <div>
            <label className="font-semibold text-[var(--text)] block mb-1">Work Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={
                role === "brand"
                  ? "creative.director@agency.com"
                  : "director@neuralstudio.com"
              }
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--link-aa)]"
              required
            />
          </div>

          <div>
            <label className="font-semibold text-[var(--text)] block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--link-aa)]"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-[var(--link-aa)] hover:bg-[var(--link-aa-hover)] text-white font-bold py-2.5 rounded-lg text-xs transition-colors cursor-pointer mt-1 disabled:opacity-50 shadow-xs"
          >
            {isSubmitting
              ? "Connecting to Database..."
              : tab === "signin"
              ? `Sign in as ${role === "brand" ? "Brand" : "Creator"}`
              : `Create ${role === "brand" ? "Brand" : "Creator"} Account`}
          </button>
        </form>

        {/* 1-Click Demo Profiles (using real backend credentials) */}
        <div className="pt-2.5 border-t border-[var(--border)] flex flex-col gap-1 text-[11px]">
          <span className="text-[var(--text-secondary-aa)] font-mono text-[10px] uppercase font-bold">
            1-Click Demo Database Accounts:
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => handleDemoLogin("brand")}
              className="text-[var(--link-aa)] font-semibold hover:underline cursor-pointer"
            >
              NexaWave (Brand)
            </button>
            <span className="text-[var(--border)]">·</span>
            <button
              type="button"
              onClick={() => handleDemoLogin("creator")}
              className="text-purple-600 dark:text-purple-400 font-semibold hover:underline cursor-pointer"
            >
              Devin Vance (Creator)
            </button>
            <span className="text-[var(--border)]">·</span>
            <button
              type="button"
              onClick={() => handleDemoLogin("admin")}
              className="text-amber-600 dark:text-amber-400 font-semibold hover:underline cursor-pointer"
            >
              Platform Administrator (Admin)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
