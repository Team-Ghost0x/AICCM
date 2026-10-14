"use client";

import React, { useState, useEffect } from "react";
import { MessageThread } from "@/lib/contract/schemas";
import {
  getThreadsForUser,
  sendMessage,
  acceptCommunicationRequest,
  declineCommunicationRequest,
  onMessagesChange,
} from "@/lib/client/messages";
import { getCurrentUser, User, UserRole } from "@/lib/client/auth";
import { playClickSound } from "@/lib/client/audio";
import { CheckIcon, CloseIcon, ArrowIcon } from "./icons";

interface MessagesInboxProps {
  initialThreadId?: string;
  roleFilter?: UserRole;
  compact?: boolean;
}

export function MessagesInbox({
  initialThreadId,
  roleFilter,
  compact = false,
}: MessagesInboxProps) {
  const [currentUser] = useState<User | null>(() => getCurrentUser());
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [filterQuery, setFilterQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [attachTake, setAttachTake] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => {
      const activeRole = roleFilter || currentUser?.role || "brand";
      const userThreads = getThreadsForUser(currentUser?.id || "client-vikram", activeRole);
      setThreads(userThreads);

      if (userThreads.length > 0 && !activeThreadId) {
        if (initialThreadId && userThreads.some((t) => t.id === initialThreadId)) {
          setActiveThreadId(initialThreadId);
        } else {
          setActiveThreadId(userThreads[0].id);
        }
      }
    };

    refresh();
    const unsubscribe = onMessagesChange(refresh);
    return () => unsubscribe();
  }, [initialThreadId, roleFilter, activeThreadId, currentUser]);

  const activeThread = threads.find((t) => t.id === activeThreadId) || threads[0] || null;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() && !attachTake) return;
    if (!activeThread) return;

    playClickSound();

    const sender = currentUser || {
      id: "client-vikram",
      name: "Vikram Sharma",
      email: "vikram@zomatostudios.com",
      company: "Zomato Studios",
      role: "brand",
      balanceInr: 350000,
      credits: 24,
      provider: "google",
    };

    const attachments = attachTake
      ? [
          {
            type: "take" as const,
            title: `Take ${Math.floor(Math.random() * 20) + 1}: High-Res Neural Diffusion Pass`,
            url: "/media/hero/take-4.jpg",
            takeNumber: Math.floor(Math.random() * 20) + 1,
            details: "ComfyUI LoRA generation pass with 8K texture upscale",
          },
        ]
      : undefined;

    sendMessage({
      threadId: activeThread.id,
      sender,
      text: replyText.trim(),
      attachments,
    });

    setReplyText("");
    setAttachTake(false);
  };

  const handleAccept = (threadId: string) => {
    playClickSound();
    acceptCommunicationRequest(threadId);
    setFeedbackToast("Project Request Accepted! Escrow Milestone Activated.");
    setTimeout(() => setFeedbackToast(null), 3000);
  };

  const handleDecline = (threadId: string) => {
    playClickSound();
    declineCommunicationRequest(threadId);
    setFeedbackToast("Communication request declined.");
    setTimeout(() => setFeedbackToast(null), 3000);
  };

  const filteredThreads = threads.filter((th) => {
    const matchesSearch =
      th.projectTitle.toLowerCase().includes(filterQuery.toLowerCase()) ||
      th.participants.some((p) => p.name.toLowerCase().includes(filterQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (statusFilter === "all") return true;
    return th.status === statusFilter;
  });

  if (threads.length === 0) {
    return (
      <div className="w-full bg-[var(--surface)] p-12 border border-[var(--border)] rounded-2xl text-center flex flex-col items-center justify-center gap-3 shadow-sm">
        <span className="w-3 h-3 rounded-full bg-[var(--link-aa)] inline-block" />
        <h4 className="text-xl font-bold text-[var(--text)]">No Active Communications Yet</h4>
        <p className="text-xs text-[var(--text-secondary-aa)] max-w-md">
          Browse creators in the discovery directory and invite creators or submit proposals to campaign briefs to begin collaborating.
        </p>
      </div>
    );
  }

  return (
    <div className={`w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl flex flex-col md:flex-row ${compact ? "h-[560px]" : "h-[680px]"} text-left overflow-hidden shadow-sm`}>
      {/* Toast Feedback */}
      {feedbackToast && (
        <div className="absolute top-4 right-4 z-50 bg-[var(--text)] text-[var(--bg)] text-xs font-mono py-2 px-4 rounded-xl border border-[var(--border)] shadow-lg animate-bounce">
          {feedbackToast}
        </div>
      )}

      {/* Left Column: Threads Rail */}
      <div className="w-full md:w-[340px] lg:w-[380px] flex-shrink-0 bg-[var(--surface-sunken)] border-r border-[var(--border)] flex flex-col h-full">
        {/* Header & Filter Controls */}
        <div className="p-4 border-b border-[var(--border)] flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--text)] uppercase font-mono tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--link-aa)] inline-block" />
              Conversations ({threads.length})
            </span>
          </div>

          {/* Search */}
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Search by brand, creator or title..."
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-1.5 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--text)]"
          />

          {/* Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto text-[10px] font-mono">
            {["all", "pending", "accepted", "in_production"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg cursor-pointer whitespace-nowrap transition-colors ${
                  statusFilter === st
                    ? "bg-[var(--text)] text-[var(--bg)] font-bold"
                    : "bg-[var(--surface)] text-[var(--text-secondary-aa)] hover:text-[var(--text)] border border-[var(--border)]"
                }`}
              >
                {st === "all" ? "All" : st.replace("_", " ").toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Threads List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[var(--border)]">
          {filteredThreads.map((thread) => {
            const isSelected = thread.id === activeThread?.id;
            const otherParty =
              thread.participants.find((p) => p.id !== currentUser?.id) ||
              thread.participants[0];

            return (
              <div
                key={thread.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  playClickSound();
                  setActiveThreadId(thread.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    playClickSound();
                    setActiveThreadId(thread.id);
                  }
                }}
                className={`p-3.5 text-left cursor-pointer transition-all flex flex-col gap-1.5 ${
                  isSelected
                    ? "bg-[var(--surface)] border-l-4 border-l-[var(--link-aa)]"
                    : "hover:bg-[var(--surface)]/60 border-l-4 border-l-transparent"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[var(--text)] truncate max-w-[190px]">
                    {otherParty.name}
                  </span>
                  <span className="text-[10px] font-mono text-[var(--text-secondary-aa)]">
                    {new Date(thread.lastMessageAt).toLocaleDateString("en-IN", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11px] font-medium text-[var(--text-secondary-aa)] truncate max-w-[220px]">
                    {thread.projectTitle}
                  </span>

                  {/* Status Badges */}
                  <span
                    className={`text-[9px] px-2 py-0.5 font-mono uppercase font-bold rounded-md border ${
                      thread.status === "pending"
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                        : thread.status === "in_production"
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                        : thread.status === "accepted"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : "bg-[var(--surface)] text-[var(--text-secondary-aa)] border-[var(--border)]"
                    }`}
                  >
                    {thread.status.replace("_", " ")}
                  </span>
                </div>

                <p className="text-[11px] text-[var(--text-secondary-aa)] line-clamp-1 italic">
                  {thread.lastMessage}
                </p>

                {thread.budgetInr && (
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    ₹{thread.budgetInr.toLocaleString("en-IN")}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Active Conversation Pane */}
      {activeThread ? (
        <div className="flex-1 flex flex-col h-full bg-[var(--surface)]">
          {/* Top Thread Bar */}
          <div className="p-4 border-b border-[var(--border)] bg-[var(--surface)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--link-aa)] inline-block" />
                <h3 className="text-base font-extrabold text-[var(--text)] tracking-tight">
                  {activeThread.projectTitle}
                </h3>
              </div>
              <div className="flex items-center gap-3 text-xs text-[var(--text-secondary-aa)] mt-0.5">
                <span>
                  Participants:{" "}
                  <strong className="text-[var(--text)]">
                    {activeThread.participants.map((p) => p.name).join(" ↔ ")}
                  </strong>
                </span>
                {activeThread.budgetInr && (
                  <>
                    <span>·</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      Budget: ₹{activeThread.budgetInr.toLocaleString("en-IN")}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Status & Actions Bar */}
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] px-2.5 py-1 font-mono uppercase font-bold rounded-md border ${
                  activeThread.status === "pending"
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                    : activeThread.status === "in_production"
                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                    : activeThread.status === "accepted"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    : "bg-[var(--surface-sunken)] text-[var(--text-secondary-aa)] border-[var(--border)]"
                }`}
              >
                {activeThread.status.replace("_", " ")}
              </span>

              {/* Accept / Decline Action Buttons if Pending */}
              {activeThread.status === "pending" && (
                <div className="flex items-center gap-1.5 ml-2">
                  <button
                    type="button"
                    onClick={() => handleAccept(activeThread.id)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                  >
                    <CheckIcon size={12} strokeWidth={3} />
                    <span>Accept</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecline(activeThread.id)}
                    className="bg-[var(--surface)] hover:bg-[var(--surface-sunken)] text-[var(--text)] font-bold text-[11px] px-3 py-1 rounded-lg border border-[var(--border)] transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <CloseIcon size={12} strokeWidth={3} />
                    <span>Decline</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-4 bg-[var(--surface-sunken)]/40">
            {activeThread.messages.map((msg) => {
              const isMe = msg.senderId === currentUser?.id;
              const isSystem = msg.senderId === "system";

              if (isSystem) {
                return (
                  <div
                    key={msg.id}
                    className="w-full bg-[var(--surface)] text-[var(--text-secondary-aa)] p-2.5 text-center font-mono text-[11px] border border-[var(--border)] rounded-xl my-1"
                  >
                    {msg.text}
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col max-w-[85%] sm:max-w-[70%] ${
                    isMe ? "ml-auto items-end" : "mr-auto items-start"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1 text-[10px] font-mono text-[var(--text-secondary-aa)]">
                    <span className="font-bold text-[var(--text)]">{msg.senderName}</span>
                    <span>·</span>
                    <span className="uppercase text-[9px] bg-[var(--surface-sunken)] px-1.5 py-0.5 rounded border border-[var(--border)]">
                      {msg.senderRole}
                    </span>
                    <span>·</span>
                    <span>
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div
                    className={`p-3.5 text-xs rounded-2xl shadow-xs ${
                      isMe
                        ? "bg-[var(--text)] text-[var(--bg)] rounded-tr-xs"
                        : "bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] rounded-tl-xs"
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>

                    {/* Take / Prompt Attachments */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-current/20 flex flex-col gap-2">
                        {msg.attachments.map((att, idx) => (
                          <div
                            key={idx}
                            className={`p-2 rounded-xl flex items-center gap-2.5 ${
                              isMe ? "bg-black/20 text-[var(--bg)]" : "bg-[var(--surface-sunken)] text-[var(--text)] border border-[var(--border)]"
                            }`}
                          >
                            {att.url && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={att.url}
                                alt={att.title}
                                onError={(e) => {
                                  (e.currentTarget as HTMLElement).style.display = "none";
                                }}
                                className="w-12 h-12 object-cover rounded-lg border border-[var(--border)] flex-shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <span className="font-bold text-[11px] block truncate">
                                {att.title}
                              </span>
                              {att.details && (
                                <span className="text-[10px] text-opacity-80 block truncate font-mono">
                                  {att.details}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Message Input Composer */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 border-t border-[var(--border)] bg-[var(--surface)] flex flex-col gap-2"
          >
            {attachTake && (
              <div className="bg-[var(--surface-sunken)] p-2.5 border border-[var(--border)] rounded-xl flex items-center justify-between text-xs">
                <span className="font-mono text-[11px] text-[var(--text)]">
                  [ATTACHED] Keyframe Diffusion Take (ComfyUI / Runway Gen-3)
                </span>
                <button
                  type="button"
                  onClick={() => setAttachTake(false)}
                  className="text-xs text-red-500 font-bold cursor-pointer hover:underline"
                >
                  Remove
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setAttachTake(!attachTake);
                }}
                title="Attach Key Take from Screening Room"
                className={`p-2 border text-xs font-mono font-bold transition-all cursor-pointer rounded-xl ${
                  attachTake
                    ? "bg-[var(--link-aa)] text-[var(--bg)] border-[var(--link-aa)]"
                    : "bg-[var(--surface-sunken)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--surface)]"
                }`}
              >
                + Take
              </button>

              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your message, prompt modification or milestone feedback..."
                className="flex-1 bg-[var(--surface-sunken)] border border-[var(--border)] rounded-xl px-3.5 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--text)]"
              />

              <button
                type="submit"
                className="bg-[var(--text)] hover:opacity-90 text-[var(--bg)] font-bold text-xs px-5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <span>Send</span>
                <ArrowIcon size={14} />
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-8 text-center text-xs text-[var(--text-secondary-aa)]">
          Select a conversation from the left to view messages.
        </div>
      )}
    </div>
  );
}
