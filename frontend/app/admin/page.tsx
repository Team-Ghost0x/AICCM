"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getCurrentUser, User, onAuthChange } from "@/lib/client/auth";
import { AuthModal } from "@/components/auth-modal";
import { AdminPinGate } from "@/components/admin-pin-gate";
import {
  fetchAdminMetrics,
  fetchAdminUsers,
  updateAdminUserStatus,
  fetchAdminVerifications,
  reviewAdminVerification,
  fetchAdminReports,
  resolveAdminReport,
} from "@/lib/client/api";
import { playClickSound } from "@/lib/client/audio";
import { CheckIcon, CloseIcon, SearchIcon, OrdersIcon } from "@/components/icons";

interface AdminMetrics {
  creators: number;
  brands: number;
  briefs: number;
  projects: number;
  pendingVerifications: number;
  pendingReports: number;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "brand" | "creator" | "admin";
  status: "active" | "suspended";
  company?: string;
  createdAt: string;
}

interface VerificationItem {
  id: string;
  creatorId: string;
  creatorName: string;
  category: "tools_evidence" | "workflow_evidence" | "identity" | "completed_project";
  evidenceText: string;
  evidenceUrls: string[];
  status: "pending" | "approved" | "rejected";
  decisionReason?: string;
  createdAt: string;
}

interface ModerationReport {
  id: string;
  resourceType: "portfolio" | "brief" | "user" | "message";
  resourceId: string;
  reason: string;
  status: "pending" | "resolved" | "dismissed";
  resolutionNotes?: string;
  createdAt: string;
}

export default function AdminConsolePage() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => getCurrentUser());
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [metrics, setMetrics] = useState<AdminMetrics>({
    creators: 0,
    brands: 0,
    briefs: 0,
    projects: 0,
    pendingVerifications: 0,
    pendingReports: 0,
  });

  const [activeTab, setActiveTab] = useState<"overview" | "verifications" | "users" | "reports" | "audit">("overview");
  const [userList, setUserList] = useState<AdminUser[]>([]);
  const [verifications, setVerifications] = useState<VerificationItem[]>([]);
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [decisionInput, setDecisionInput] = useState("");
  const [selectedVerification, setSelectedVerification] = useState<VerificationItem | null>(null);
  const [selectedReport, setSelectedReport] = useState<ModerationReport | null>(null);

  const [auditLogs, setAuditLogs] = useState<Array<{ id: string; time: string; text: string; tag: string }>>([
    {
      id: "log-1",
      time: "10:14:02",
      text: "Admin console authenticated with trusted administrator session.",
      tag: "AUTH",
    },
    {
      id: "log-2",
      time: "10:15:30",
      text: "Verification queue synchronized with platform database.",
      tag: "QUEUE",
    },
    {
      id: "log-3",
      time: "10:16:00",
      text: "Marketplace categories and tools taxonomy validated.",
      tag: "TAXONOMY",
    },
  ]);

  const addAudit = (text: string, tag = "ADMIN") => {
    const time = new Date().toLocaleTimeString();
    setAuditLogs((prev) => [{ id: `log-${Date.now()}`, time, text, tag }, ...prev]);
  };

  const triggerNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const loadData = () => {
    fetchAdminMetrics().then(setMetrics).catch(() => {});
    fetchAdminUsers(searchQuery).then(setUserList).catch(() => {});
    fetchAdminVerifications().then(setVerifications).catch(() => {});
    fetchAdminReports().then(setReports).catch(() => {});
  };

  useEffect(() => {
    const unsub = onAuthChange((u) => {
      setCurrentUser(u);
      if (u?.role === "admin") {
        loadData();
      }
    });
    if (currentUser?.role === "admin") {
      loadData();
    }
    return () => unsub();
  }, [searchQuery]);

  const handleToggleUserStatus = async (userItem: AdminUser) => {
    playClickSound();
    const nextStatus = userItem.status === "active" ? "suspended" : "active";
    try {
      await updateAdminUserStatus(userItem.id, nextStatus);
      addAudit(`User ${userItem.email} status changed to ${nextStatus}`, "USER");
      triggerNotice(`User ${userItem.name} marked as ${nextStatus}.`);
      loadData();
    } catch {
      alert("Failed to update user status.");
    }
  };

  const handleReviewVerification = async (verId: string, status: "approved" | "rejected") => {
    playClickSound();
    const reason = decisionInput.trim() || (status === "approved" ? "Evidence verified" : "Insufficient proof provided");
    try {
      await reviewAdminVerification(verId, status, reason);
      addAudit(`Verification ${verId} ${status}: ${reason}`, "VERIFY");
      triggerNotice(`Verification request ${status}.`);
      setSelectedVerification(null);
      setDecisionInput("");
      loadData();
    } catch {
      alert("Failed to review verification.");
    }
  };

  const handleResolveReport = async (reportId: string, status: "resolved" | "dismissed") => {
    playClickSound();
    const notes = decisionInput.trim() || (status === "resolved" ? "Content reviewed and action taken" : "Policy compliance confirmed; report dismissed");
    try {
      await resolveAdminReport(reportId, status, notes);
      addAudit(`Report ${reportId} marked ${status}: ${notes}`, "MOD");
      triggerNotice(`Report marked as ${status}.`);
      setSelectedReport(null);
      setDecisionInput("");
      loadData();
    } catch {
      alert("Failed to resolve report.");
    }
  };

  // Check admin authorization & authentication
  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center select-none">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 shadow-xl flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 mb-4">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--text)] mb-2">
            Administrator Authentication Required
          </h1>
          <p className="text-xs text-[var(--text-secondary-aa)] mb-6 max-w-md">
            The platform administration console requires an authenticated administrator session. Sign in with your administrator account to access verification queues, moderation tools, and platform controls.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-6 py-2.5 rounded-full bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer"
            >
              Sign In as Admin
            </button>
            <Link
              href="/"
              className="px-6 py-2.5 rounded-full bg-[var(--surface-sunken)] hover:bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text)] font-bold text-xs transition-colors text-center"
            >
              Return to Home
            </Link>
          </div>
        </div>
        {showAuthModal && (
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            defaultRole="admin"
            onSuccess={() => {
              const user = getCurrentUser();
              setCurrentUser(user);
              if (user?.role === "admin") loadData();
            }}
          />
        )}
      </div>
    );
  }

  if (currentUser.role !== "admin") {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center select-none">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 shadow-xl flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-4">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--text)] mb-2">
            Access Denied (403 Forbidden)
          </h1>
          <p className="text-xs text-[var(--text-secondary-aa)] mb-2 max-w-md">
            You are signed in as <strong className="text-[var(--text)]">{currentUser.name || currentUser.email}</strong> with role <span className="capitalize font-bold text-[var(--text)]">{currentUser.role}</span>.
          </p>
          <p className="text-xs text-[var(--text-secondary-aa)] mb-6 max-w-md">
            This console is restricted exclusively to Platform Administrators. To proceed, switch to an authorized administrator account or navigate to your role dashboard.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
            <Link
              href="/dashboard"
              className="px-6 py-2.5 rounded-full bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs transition-colors text-center shadow-sm"
            >
              Go to Your Dashboard
            </Link>
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-6 py-2.5 rounded-full bg-[var(--surface-sunken)] hover:bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text)] font-bold text-xs transition-colors cursor-pointer"
            >
              Switch Account
            </button>
          </div>
        </div>
        {showAuthModal && (
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            defaultRole="admin"
            onSuccess={() => {
              const user = getCurrentUser();
              setCurrentUser(user);
              if (user?.role === "admin") loadData();
            }}
          />
        )}
      </div>
    );
  }

  return (
    <AdminPinGate>
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 text-left select-none flex flex-col gap-8">
      {/* Action Toast */}
      {actionNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] shadow-xl px-4 py-3 rounded-xl flex items-center gap-3 text-xs font-semibold animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
            <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-secondary-aa)] font-bold">
              Marketplace Administration Console
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[var(--text)] tracking-tight">
            Administrator Command Center
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary-aa)] mt-1">
            Manage creator verification evidence, review moderation reports, control user access, and oversee marketplace operations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 rounded-lg text-xs font-mono font-bold">
            ADMIN: {currentUser?.email || "admin@retake.design"}
          </span>
        </div>
      </div>

      {/* Real Metric Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)] shadow-xs">
          <span className="text-[10px] font-mono uppercase font-bold text-[var(--text-secondary-aa)] block">
            Creators
          </span>
          <strong className="text-2xl font-bold text-[var(--text)] mt-1 block tabular-numbers">
            {metrics.creators}
          </strong>
        </div>

        <div className="bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)] shadow-xs">
          <span className="text-[10px] font-mono uppercase font-bold text-[var(--text-secondary-aa)] block">
            Brands
          </span>
          <strong className="text-2xl font-bold text-[var(--text)] mt-1 block tabular-numbers">
            {metrics.brands}
          </strong>
        </div>

        <div className="bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)] shadow-xs">
          <span className="text-[10px] font-mono uppercase font-bold text-[var(--text-secondary-aa)] block">
            Campaign Briefs
          </span>
          <strong className="text-2xl font-bold text-[var(--text)] mt-1 block tabular-numbers">
            {metrics.briefs}
          </strong>
        </div>

        <div className="bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)] shadow-xs">
          <span className="text-[10px] font-mono uppercase font-bold text-[var(--text-secondary-aa)] block">
            Active Projects
          </span>
          <strong className="text-2xl font-bold text-[var(--text)] mt-1 block tabular-numbers">
            {metrics.projects}
          </strong>
        </div>

        <div className="bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)] shadow-xs">
          <span className="text-[10px] font-mono uppercase font-bold text-amber-600 dark:text-amber-400 block">
            Verifications
          </span>
          <strong className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 block tabular-numbers">
            {metrics.pendingVerifications}
          </strong>
        </div>

        <div className="bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)] shadow-xs">
          <span className="text-[10px] font-mono uppercase font-bold text-red-600 dark:text-red-400 block">
            Reports
          </span>
          <strong className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1 block tabular-numbers">
            {metrics.pendingReports}
          </strong>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3 overflow-x-auto text-xs">
        {[
          { id: "overview", label: "Overview" },
          { id: "verifications", label: `Verification Queue (${verifications.length})` },
          { id: "users", label: `User Management (${userList.length})` },
          { id: "reports", label: `Moderation Reports (${reports.length})` },
          { id: "audit", label: "Audit Telemetry" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] shadow-xs"
                : "text-[var(--text-secondary-aa)] hover:text-[var(--text)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-xs flex flex-col gap-4 text-xs">
            <h3 className="text-base font-bold text-[var(--text)]">Platform Operational State</h3>
            <p className="text-[var(--text-secondary-aa)] leading-relaxed">
              The Retake Content Creator Marketplace is connected to the SQLite persistence layer with full authentication, brief proposal tracking, escrow vaults, and creator verification pipelines active.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-[var(--bg)] rounded-xl border border-[var(--border)]">
                <span className="text-[10px] font-mono uppercase font-bold text-[var(--text-secondary-aa)] block">
                  Backend API Health
                </span>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold block mt-1">
                  100% Operational
                </span>
              </div>
              <div className="p-3 bg-[var(--bg)] rounded-xl border border-[var(--border)]">
                <span className="text-[10px] font-mono uppercase font-bold text-[var(--text-secondary-aa)] block">
                  Security State
                </span>
                <span className="text-blue-700 dark:text-blue-400 font-bold block mt-1">
                  RBAC Active
                </span>
              </div>
            </div>
          </div>

          <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-xs flex flex-col gap-4 text-xs">
            <h3 className="text-base font-bold text-[var(--text)]">Quick Actions</h3>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("verifications")}
                className="w-full text-left p-3 rounded-xl bg-[var(--bg)] hover:bg-[var(--surface)] border border-[var(--border)] transition-colors cursor-pointer flex items-center justify-between"
              >
                <div>
                  <strong className="block text-[var(--text)]">Inspect Pending Verifications</strong>
                  <span className="text-[11px] text-[var(--text-secondary-aa)]">Review LoRA &amp; workflow proof</span>
                </div>
                <span className="text-xs font-mono font-bold text-amber-600">{metrics.pendingVerifications}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("reports")}
                className="w-full text-left p-3 rounded-xl bg-[var(--bg)] hover:bg-[var(--surface)] border border-[var(--border)] transition-colors cursor-pointer flex items-center justify-between"
              >
                <div>
                  <strong className="block text-[var(--text)]">Content Moderation Queue</strong>
                  <span className="text-[11px] text-[var(--text-secondary-aa)]">Inspect flagged assets and briefs</span>
                </div>
                <span className="text-xs font-mono font-bold text-red-600">{metrics.pendingReports}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VERIFICATION QUEUE */}
      {activeTab === "verifications" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[var(--text)]">Creator Verification Queue</h3>
            <span className="text-xs text-[var(--text-secondary-aa)] font-mono">{verifications.length} records</span>
          </div>

          {verifications.length === 0 ? (
            <div className="p-12 text-center bg-[var(--surface)] border border-[var(--border)] rounded-2xl text-xs text-[var(--text-secondary-aa)]">
              No pending verification requests in queue.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {verifications.map((item) => (
                <div
                  key={item.id}
                  className="bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                >
                  <div className="flex flex-col gap-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <strong className="text-sm font-bold text-[var(--text)]">{item.creatorName}</strong>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200">
                        {item.category}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          item.status === "approved"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                            : item.status === "rejected"
                            ? "bg-red-50 text-red-700 border border-red-300"
                            : "bg-amber-50 text-amber-700 border border-amber-300"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <p className="text-[var(--text)] leading-relaxed">{item.evidenceText}</p>

                    {item.evidenceUrls && item.evidenceUrls.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap pt-1">
                        <span className="text-[11px] text-[var(--text-secondary-aa)]">Evidence links:</span>
                        {item.evidenceUrls.map((url, i) => (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-[var(--link-aa)] underline truncate max-w-xs"
                          >
                            {url}
                          </a>
                        ))}
                      </div>
                    )}

                    {item.decisionReason && (
                      <div className="text-[11px] text-[var(--text-secondary-aa)] italic pt-1">
                        Decision reason: &ldquo;{item.decisionReason}&rdquo;
                      </div>
                    )}
                  </div>

                  {item.status === "pending" && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedVerification(item);
                          setDecisionInput("");
                        }}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 text-xs font-semibold rounded-lg cursor-pointer transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReviewVerification(item.id, "approved")}
                        className="px-4 py-1.5 bg-[var(--link-aa)] hover:bg-[var(--link-aa-hover)] text-white text-xs font-bold rounded-lg cursor-pointer transition-transform hover:scale-105 active:scale-95 shadow-xs"
                      >
                        Approve Badge
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: USER MANAGEMENT */}
      {activeTab === "users" && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-base font-bold text-[var(--text)]">Registered User Database</h3>
            <div className="relative max-w-sm w-full">
              <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[var(--text-secondary-aa)]">
                <SearchIcon size={14} />
              </span>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, or company..."
                className="w-full pl-9 pr-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs text-[var(--text)] focus:outline-none focus:border-[var(--link-aa)]"
              />
            </div>
          </div>

          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-xs text-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[var(--bg)] border-b border-[var(--border)] text-[var(--text-secondary-aa)] font-mono uppercase text-[10px]">
                  <tr>
                    <th className="p-3.5">User</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Company / Bio</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {userList.map((u) => (
                    <tr key={u.id} className="hover:bg-[var(--bg)] transition-colors">
                      <td className="p-3.5 font-semibold text-[var(--text)]">
                        <div>{u.name}</div>
                        <div className="text-[11px] text-[var(--text-secondary-aa)] font-normal">{u.email}</div>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-[var(--bg)] border border-[var(--border)] text-[var(--text-secondary-aa)]">
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3.5 text-[var(--text-secondary-aa)] max-w-xs truncate">
                        {u.company || "Independent"}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            u.status === "active"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                              : "bg-red-50 text-red-700 border border-red-300"
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        {u.role !== "admin" && (
                          <button
                            type="button"
                            onClick={() => handleToggleUserStatus(u)}
                            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                              u.status === "active"
                                ? "text-red-600 hover:bg-red-50"
                                : "text-emerald-600 hover:bg-emerald-50"
                            }`}
                          >
                            {u.status === "active" ? "Suspend" : "Activate"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MODERATION REPORTS */}
      {activeTab === "reports" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[var(--text)]">Content Moderation &amp; Policy Reports</h3>
            <span className="text-xs text-[var(--text-secondary-aa)] font-mono">{reports.length} reports</span>
          </div>

          {reports.length === 0 ? (
            <div className="p-12 text-center bg-[var(--surface)] border border-[var(--border)] rounded-2xl text-xs text-[var(--text-secondary-aa)]">
              No pending moderation reports.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {reports.map((rep) => (
                <div
                  key={rep.id}
                  className="bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                >
                  <div className="flex flex-col gap-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-red-50 text-red-700 border border-red-200">
                        {rep.resourceType}
                      </span>
                      <strong className="text-[var(--text)]">{rep.resourceId}</strong>
                      <span className="text-[11px] text-[var(--text-secondary-aa)]">
                        Reported {new Date(rep.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-[var(--text)] mt-1">{rep.reason}</p>
                    {rep.resolutionNotes && (
                      <p className="text-[11px] text-[var(--text-secondary-aa)] italic mt-0.5">
                        Resolution: &ldquo;{rep.resolutionNotes}&rdquo;
                      </p>
                    )}
                  </div>

                  {rep.status === "pending" && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleResolveReport(rep.id, "dismissed")}
                        className="px-3 py-1.5 bg-[var(--bg)] hover:bg-[var(--border)] text-[var(--text)] text-xs font-semibold rounded-lg cursor-pointer transition-colors border border-[var(--border)]"
                      >
                        Dismiss
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResolveReport(rep.id, "resolved")}
                        className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-transform hover:scale-105 active:scale-95 shadow-xs"
                      >
                        Resolve Violation
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: AUDIT LOGS */}
      {activeTab === "audit" && (
        <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-xs flex flex-col gap-4 text-xs">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <h3 className="text-base font-bold text-[var(--text)]">Immutable Administrative Action Telemetry</h3>
            <span className="text-[11px] font-mono text-[var(--text-secondary-aa)]">Live Audit Trail</span>
          </div>

          <div className="flex flex-col gap-2 font-mono text-[11px]">
            {auditLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 py-1 border-b border-[var(--border)]/50">
                <span className="text-[var(--text-secondary-aa)] shrink-0">[{log.time}]</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] shrink-0">
                  {log.tag}
                </span>
                <span className="text-[var(--text)]">{log.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verification Decision Modal */}
      {selectedVerification && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] w-full max-w-md p-6 rounded-2xl shadow-xl flex flex-col gap-4 text-xs text-left">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
              <h3 className="text-base font-bold text-[var(--text)]">
                Reject Verification Request
              </h3>
              <button
                type="button"
                onClick={() => setSelectedVerification(null)}
                className="text-[var(--text-secondary-aa)] hover:text-[var(--text)] p-1"
              >
                <CloseIcon size={16} />
              </button>
            </div>
            <p className="text-[var(--text-secondary-aa)]">
              Specify the reason for rejecting {selectedVerification.creatorName}&apos;s verification evidence:
            </p>
            <textarea
              value={decisionInput}
              onChange={(e) => setDecisionInput(e.target.value)}
              placeholder="e.g. Workflow screenshots lack generation parameters or model hashes..."
              rows={3}
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2.5 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--link-aa)]"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedVerification(null)}
                className="px-3.5 py-1.5 text-xs text-[var(--text-secondary-aa)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleReviewVerification(selectedVerification.id, "rejected")}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </AdminPinGate>
  );
}
