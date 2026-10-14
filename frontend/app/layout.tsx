import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";
import { AppHeader } from "@/components/header";

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  axes: ["wdth"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Retake — AI Content Creator Marketplace",
  description:
    "Hire AI filmmakers, animators, and generative artists based on real process, iterations, and verified commercial rights.",
};

import React, { Suspense } from "react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${archivo.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-[var(--bg)] text-[var(--text)] antialiased transition-colors duration-200">
        <Suspense fallback={<div className="h-16 bg-[var(--surface)] border-b border-[var(--border)]" />}>
          <AppHeader />
        </Suspense>
        <main className="flex-1 w-full md:pl-[72px] lg:pl-[244px] md:pt-14">{children}</main>
        <footer className="w-full bg-[var(--surface)] border-t border-[var(--border)] py-8 mt-16 text-center text-xs text-[var(--text-secondary-aa)] md:pl-[72px] lg:pl-[244px] pb-24 md:pb-8">
          <div className="max-w-[1360px] mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[var(--text)]">retake</span>
              <span>·</span>
              <span>AI Content Creator Marketplace</span>
            </div>
            <div>
              Every AI piece is somebody&apos;s 23rd take. Hire on verified process.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
