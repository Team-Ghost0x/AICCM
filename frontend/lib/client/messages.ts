"use client";

import {
  CommunicationRequest,
  Message,
  MessageAttachment,
  MessageThread,
  Creator,
} from "@/lib/contract/schemas";
import {
  initialCommunicationRequests,
  initialMessageThreads,
  indianClients,
  allPlatformCreators,
  ClientProfile,
} from "@/lib/contract/fixtures";
import { User, UserRole } from "./auth";

const THREADS_KEY = "retake_message_threads_v2";
const REQUESTS_KEY = "retake_comms_requests_v2";

type CommsListener = () => void;
const listeners = new Set<CommsListener>();

function notifyListeners() {
  if (typeof window === "undefined") return;
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // Ignore listener error
    }
  });
  window.dispatchEvent(new CustomEvent("retake-comms-change"));
}

export function getAllClients(): ClientProfile[] {
  return indianClients;
}

export function getClientById(clientId: string): ClientProfile | null {
  return indianClients.find((c) => c.id === clientId) || null;
}

export function getCreatorById(creatorId: string): Creator | null {
  return allPlatformCreators.find((c) => c.id === creatorId || c.handle === creatorId) || null;
}

export function getAllThreads(): MessageThread[] {
  if (typeof window === "undefined") return initialMessageThreads;
  try {
    const raw = localStorage.getItem(THREADS_KEY);
    if (!raw) {
      localStorage.setItem(THREADS_KEY, JSON.stringify(initialMessageThreads));
      return initialMessageThreads;
    }
    return JSON.parse(raw);
  } catch {
    return initialMessageThreads;
  }
}

export function saveAllThreads(threads: MessageThread[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(THREADS_KEY, JSON.stringify(threads));
    notifyListeners();
  } catch {
    // Ignore storage issues
  }
}

export function getAllRequests(): CommunicationRequest[] {
  if (typeof window === "undefined") return initialCommunicationRequests;
  try {
    const raw = localStorage.getItem(REQUESTS_KEY);
    if (!raw) {
      localStorage.setItem(REQUESTS_KEY, JSON.stringify(initialCommunicationRequests));
      return initialCommunicationRequests;
    }
    return JSON.parse(raw);
  } catch {
    return initialCommunicationRequests;
  }
}

export function saveAllRequests(requests: CommunicationRequest[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
    notifyListeners();
  } catch {
    // Ignore storage issues
  }
}

export function getThreadsForUser(userId: string, userRole: UserRole): MessageThread[] {
  const all = getAllThreads();
  if (userRole === "admin") {
    // Platform developer sees all communication channels across the marketplace
    return all;
  }
  return all.filter((th) =>
    th.participants.some((p) => p.id === userId || p.role === userRole)
  );
}

export function getThreadById(threadId: string): MessageThread | null {
  const all = getAllThreads();
  return all.find((th) => th.id === threadId) || null;
}

export function getRequestsForUser(userId: string, userRole: UserRole): CommunicationRequest[] {
  const all = getAllRequests();
  if (userRole === "admin") return all;
  return all.filter((r) => r.fromUserId === userId || r.toUserId === userId);
}

/**
 * Universal Bidirectional Communication Request Dispatcher
 * Allows Clients to request Creators, Creators to pitch Clients, and Creators to collaborate with Creators.
 */
export function sendCommunicationRequest({
  fromUser,
  toCreator,
  toClient,
  projectTitle,
  proposedBudgetInr,
  targetDeadline,
  message,
  briefId,
}: {
  fromUser: User;
  toCreator?: Creator;
  toClient?: ClientProfile;
  projectTitle: string;
  proposedBudgetInr?: number;
  targetDeadline?: string;
  message: string;
  briefId?: string;
}): { request: CommunicationRequest; thread: MessageThread } {
  const requestId = `req-${Date.now().toString(36)}`;
  const threadId = `thread-${Date.now().toString(36)}`;
  const now = new Date().toISOString();

  const isTargetCreator = !!toCreator;
  const targetId = isTargetCreator ? toCreator!.id : toClient!.id;
  const targetName = isTargetCreator ? toCreator!.displayName : toClient!.name;
  const targetRole = isTargetCreator ? "creator" : "brand";
  const targetCompany = isTargetCreator ? toCreator!.headline : toClient!.brandName;

  const newRequest: CommunicationRequest = {
    id: requestId,
    fromUserId: fromUser.id,
    fromUserName: fromUser.name,
    fromUserRole: fromUser.role === "creator" ? "creator" : "brand",
    fromCompany: fromUser.company || (fromUser.role === "brand" ? "Brand Enterprise" : "Creator Studio"),
    toUserId: targetId,
    toUserName: targetName,
    toUserRole: targetRole,
    briefId,
    projectTitle: projectTitle.trim() || `Project Inquiry for ${targetName}`,
    proposedBudgetInr: proposedBudgetInr || (toCreator ? toCreator.priceFromInr : 50000),
    targetDeadline,
    message: message.trim(),
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };

  const initialMsg: Message = {
    id: `msg-${Date.now().toString(36)}`,
    threadId,
    senderId: fromUser.id,
    senderName: fromUser.name,
    senderRole: fromUser.role,
    text: message.trim(),
    timestamp: now,
  };

  const newThread: MessageThread = {
    id: threadId,
    requestId,
    projectTitle: newRequest.projectTitle,
    status: "pending",
    participants: [
      {
        id: fromUser.id,
        name: fromUser.name,
        role: fromUser.role,
        company: fromUser.company,
      },
      {
        id: targetId,
        name: targetName,
        role: targetRole,
        company: targetCompany,
      },
    ],
    budgetInr: newRequest.proposedBudgetInr,
    lastMessage: message.trim(),
    lastMessageAt: now,
    unreadCount: {
      [targetId]: 1,
      [fromUser.id]: 0,
    },
    messages: [initialMsg],
  };

  const requests = [newRequest, ...getAllRequests()];
  const threads = [newThread, ...getAllThreads()];

  saveAllRequests(requests);
  saveAllThreads(threads);

  return { request: newRequest, thread: newThread };
}

/**
 * Creator pitches directly to a Client/Brand for a brief or collaboration
 */
export function sendCreatorToClientPitch({
  fromCreatorUser,
  toClient,
  projectTitle,
  proposedBudgetInr,
  targetDeadline,
  message,
  briefId,
  takeAttachment,
}: {
  fromCreatorUser: User;
  toClient: ClientProfile;
  projectTitle: string;
  proposedBudgetInr?: number;
  targetDeadline?: string;
  message: string;
  briefId?: string;
  takeAttachment?: {
    title: string;
    url: string;
    takeNumber: number;
    details: string;
  };
}): { request: CommunicationRequest; thread: MessageThread } {
  const { request, thread } = sendCommunicationRequest({
    fromUser: fromCreatorUser,
    toClient,
    projectTitle,
    proposedBudgetInr,
    targetDeadline,
    message,
    briefId,
  });

  if (takeAttachment && thread.messages.length > 0) {
    const updatedMessages = [...thread.messages];
    updatedMessages[0].attachments = [
      {
        type: "take",
        title: takeAttachment.title,
        url: takeAttachment.url,
        takeNumber: takeAttachment.takeNumber,
        details: takeAttachment.details,
      },
    ];
    thread.messages = updatedMessages;
    saveAllThreads(getAllThreads().map((t) => (t.id === thread.id ? thread : t)));
  }

  return { request, thread };
}

export function acceptCommunicationRequest(threadId: string): MessageThread | null {
  const threads = getAllThreads();
  const threadIndex = threads.findIndex((t) => t.id === threadId);
  if (threadIndex === -1) return null;

  const targetThread = { ...threads[threadIndex] };
  targetThread.status = "accepted";

  const acceptMsg: Message = {
    id: `msg-sys-${Date.now()}`,
    threadId,
    senderId: "system",
    senderName: "Retake Studio Escrow",
    senderRole: "admin",
    text: "✓ Communication request accepted! Milestone escrow pipeline is now enabled for this project.",
    timestamp: new Date().toISOString(),
  };

  targetThread.messages = [...targetThread.messages, acceptMsg];
  targetThread.lastMessage = acceptMsg.text;
  targetThread.lastMessageAt = acceptMsg.timestamp;
  threads[threadIndex] = targetThread;

  // Also update request status
  if (targetThread.requestId) {
    const requests = getAllRequests();
    const reqIndex = requests.findIndex((r) => r.id === targetThread.requestId);
    if (reqIndex !== -1) {
      requests[reqIndex] = {
        ...requests[reqIndex],
        status: "accepted",
        updatedAt: new Date().toISOString(),
      };
      saveAllRequests(requests);
    }
  }

  saveAllThreads(threads);
  return targetThread;
}

export function declineCommunicationRequest(threadId: string): MessageThread | null {
  const threads = getAllThreads();
  const threadIndex = threads.findIndex((t) => t.id === threadId);
  if (threadIndex === -1) return null;

  const targetThread = { ...threads[threadIndex] };
  targetThread.status = "declined";

  const declineMsg: Message = {
    id: `msg-sys-${Date.now()}`,
    threadId,
    senderId: "system",
    senderName: "Retake Studio Escrow",
    senderRole: "admin",
    text: "✕ Communication request declined. The creator is not available for this project at this time.",
    timestamp: new Date().toISOString(),
  };

  targetThread.messages = [...targetThread.messages, declineMsg];
  targetThread.lastMessage = declineMsg.text;
  targetThread.lastMessageAt = declineMsg.timestamp;
  threads[threadIndex] = targetThread;

  if (targetThread.requestId) {
    const requests = getAllRequests();
    const reqIndex = requests.findIndex((r) => r.id === targetThread.requestId);
    if (reqIndex !== -1) {
      requests[reqIndex] = {
        ...requests[reqIndex],
        status: "declined",
        updatedAt: new Date().toISOString(),
      };
      saveAllRequests(requests);
    }
  }

  saveAllThreads(threads);
  return targetThread;
}

export function sendMessage({
  threadId,
  sender,
  text,
  attachments,
}: {
  threadId: string;
  sender: User;
  text: string;
  attachments?: MessageAttachment[];
}): Message | null {
  if (!text.trim() && (!attachments || attachments.length === 0)) return null;

  const threads = getAllThreads();
  const index = threads.findIndex((t) => t.id === threadId);
  if (index === -1) return null;

  const now = new Date().toISOString();
  const newMsg: Message = {
    id: `msg-${Date.now().toString(36)}`,
    threadId,
    senderId: sender.id,
    senderName: sender.name,
    senderRole: sender.role,
    text: text.trim(),
    attachments,
    timestamp: now,
  };

  const updatedThread = { ...threads[index] };
  updatedThread.messages = [...updatedThread.messages, newMsg];
  updatedThread.lastMessage = text.trim() || attachments?.[0]?.title || "Sent an attachment";
  updatedThread.lastMessageAt = now;

  // Increment unread for all other participants
  const updatedUnread = { ...updatedThread.unreadCount };
  updatedThread.participants.forEach((p) => {
    if (p.id !== sender.id) {
      updatedUnread[p.id] = (updatedUnread[p.id] || 0) + 1;
    }
  });
  updatedThread.unreadCount = updatedUnread;

  threads[index] = updatedThread;
  saveAllThreads(threads);

  return newMsg;
}

export function resetToDefaultData(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(THREADS_KEY, JSON.stringify(initialMessageThreads));
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(initialCommunicationRequests));
  notifyListeners();
}

export function onMessagesChange(callback: CommsListener): () => void {
  listeners.add(callback);
  if (typeof window !== "undefined") {
    window.addEventListener("retake-comms-change", callback);
  }
  return () => {
    listeners.delete(callback);
    if (typeof window !== "undefined") {
      window.removeEventListener("retake-comms-change", callback);
    }
  };
}
