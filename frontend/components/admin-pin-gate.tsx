"use client";

import React, { useState, useEffect, useRef } from "react";
import { playClickSound } from "@/lib/client/audio";
import { LockIcon } from "./icons";

interface AdminPinGateProps {
  children: React.ReactNode;
}

const REQUIRED_PIN = "0000";
const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 30;
const SESSION_STORAGE_KEY = "retake_admin_session_unlocked";

export function AdminPinGate({ children }: AdminPinGateProps) {
  const [pin, setPin] = useState("");
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return sessionStorage.getItem(SESSION_STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutTimer <= 0) return;
    const interval = setInterval(() => {
      setLockoutTimer((prev) => {
        if (prev <= 1) {
          setErrorMessage(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutTimer]);

  // Focus input when locked
  useEffect(() => {
    if (!isUnlocked && lockoutTimer === 0) {
      inputRef.current?.focus();
    }
  }, [isUnlocked, lockoutTimer]);

  const handlePinSubmit = (enteredPin: string) => {
    if (lockoutTimer > 0) return;

    if (enteredPin === REQUIRED_PIN) {
      playClickSound();
      try {
        sessionStorage.setItem(SESSION_STORAGE_KEY, "true");
      } catch {}
      setIsUnlocked(true);
      setErrorMessage(null);
      setFailedAttempts(0);
    } else {
      setIsShaking(true);
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);

      if (newAttempts >= MAX_ATTEMPTS) {
        setLockoutTimer(LOCKOUT_SECONDS);
        setErrorMessage(`Too many failed attempts. Locked for ${LOCKOUT_SECONDS}s.`);
      } else {
        setErrorMessage(`Invalid passcode. ${MAX_ATTEMPTS - newAttempts} attempt(s) remaining.`);
      }

      setPin("");
      setTimeout(() => {
        setIsShaking(false);
      }, 500);
    }
  };

  const handleKeypadPress = (val: string) => {
    playClickSound();
    if (lockoutTimer > 0 || pin.length >= 4) return;
    const nextPin = pin + val;
    setPin(nextPin);
    if (nextPin.length === 4) {
      handlePinSubmit(nextPin);
    }
  };

  const handleBackspace = () => {
    playClickSound();
    if (lockoutTimer > 0) return;
    setPin((prev) => prev.slice(0, -1));
    setErrorMessage(null);
  };

  const handleClear = () => {
    playClickSound();
    setPin("");
    setErrorMessage(null);
  };

  const handleLockOut = () => {
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {}
    setIsUnlocked(false);
    setPin("");
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isUnlocked) {
    return (
      <div className="relative">
        {/* Floating Lock Session Button in Admin View */}
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 md:px-12 pt-3 flex justify-end">
          <button
            type="button"
            onClick={handleLockOut}
            className="px-3 py-1.5 bg-red-50 dark:bg-red-950/60 hover:bg-red-100 text-red-600 dark:text-red-300 text-xs font-mono font-bold rounded-lg border border-red-200 dark:border-red-900 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <LockIcon size={13} />
            <span>Lock Admin Panel</span>
          </button>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="w-full min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div
        className={`w-full max-w-sm bg-[var(--panel)] border border-[var(--border-color)] rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col items-center transition-all ${
          isShaking ? "animate-shake" : ""
        }`}
      >
        {/* Lock Icon Badge */}
        <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4 shadow-xs">
          <LockIcon size={24} />
        </div>

        <h1 className="text-xl font-black text-[var(--ink)] tracking-tight">
          Admin Access Gate
        </h1>
        <p className="text-xs text-[var(--muted)] text-center mt-1 mb-6">
          This area is restricted. Enter the 4-digit administrator passcode to proceed.
        </p>

        {/* 4-Digit Display Dots */}
        <div className="flex items-center gap-3 mb-6">
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  isFilled
                    ? "bg-purple-600 scale-110 shadow-sm shadow-purple-500/40"
                    : "bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700"
                }`}
              />
            );
          })}
        </div>

        {/* Hidden keyboard input for accessibility and physical keyboards */}
        <input
          ref={inputRef}
          type="password"
          maxLength={4}
          value={pin}
          onChange={(e) => {
            const cleaned = e.target.value.replace(/\D/g, "");
            setPin(cleaned);
            if (cleaned.length === 4) {
              handlePinSubmit(cleaned);
            }
          }}
          disabled={lockoutTimer > 0}
          className="sr-only"
          aria-label="Enter 4-digit admin passcode"
        />

        {/* Error / Lockout Feedback */}
        {errorMessage && (
          <div className="text-xs font-mono font-bold text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 px-3 py-1.5 rounded-lg mb-4 text-center">
            {errorMessage}
          </div>
        )}

        {/* Numeric Keypad (0-9) */}
        <div className="grid grid-cols-3 gap-2.5 w-full max-w-[240px]">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <button
              key={num}
              type="button"
              disabled={lockoutTimer > 0}
              onClick={() => handleKeypadPress(num)}
              className="h-12 rounded-xl bg-[var(--surround)] hover:bg-purple-50 dark:hover:bg-purple-950/40 active:bg-purple-100 text-[var(--ink)] hover:text-purple-600 font-mono font-bold text-lg transition-colors border border-[var(--border-color)] disabled:opacity-40 cursor-pointer shadow-xs active:scale-95"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            disabled={lockoutTimer > 0 || pin.length === 0}
            onClick={handleClear}
            className="h-12 rounded-xl text-xs font-mono text-[var(--muted)] hover:text-[var(--ink)] border border-transparent transition-colors disabled:opacity-30 cursor-pointer"
          >
            Clear
          </button>
          <button
            type="button"
            disabled={lockoutTimer > 0}
            onClick={() => handleKeypadPress("0")}
            className="h-12 rounded-xl bg-[var(--surround)] hover:bg-purple-50 dark:hover:bg-purple-950/40 active:bg-purple-100 text-[var(--ink)] hover:text-purple-600 font-mono font-bold text-lg transition-colors border border-[var(--border-color)] disabled:opacity-40 cursor-pointer shadow-xs active:scale-95"
          >
            0
          </button>
          <button
            type="button"
            disabled={lockoutTimer > 0 || pin.length === 0}
            onClick={handleBackspace}
            className="h-12 rounded-xl text-xs font-mono text-[var(--muted)] hover:text-[var(--ink)] border border-transparent transition-colors disabled:opacity-30 cursor-pointer"
          >
            Del
          </button>
        </div>

        {/* Helper Note */}
        <div className="mt-6 text-[10px] text-[var(--muted)] font-mono text-center">
          Security policy: Admin passcode required.
        </div>
      </div>
    </div>
  );
}
