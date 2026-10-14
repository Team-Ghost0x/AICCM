import {
  Creator,
  Brief,
  SearchResponse,
  MatchResult,
  PortfolioPiece,
} from "../contract/schemas";
import { goldenBrief, allPlatformCreators, indianBriefs } from "../contract/fixtures";
import { executeSearch, SearchParams } from "../mocks/search";
import { parseBriefDraft, DraftBriefResult } from "../mocks/draft-brief";
import { rankCreatorsForBrief } from "../mocks/match-scorer";

// Single toggle for switching between mock engine and real backend API
const USE_REAL_API = process.env.NEXT_PUBLIC_USE_REAL_API === "true";

// Local storage and in-memory store for user-created briefs
const inMemoryBriefs = new Map<string, Brief>([
  [goldenBrief.id, goldenBrief],
  ...indianBriefs.map((b) => [b.id, b] as [string, Brief]),
]);

export async function saveBrief(brief: Brief): Promise<Brief> {
  const token = typeof window !== "undefined" ? localStorage.getItem("retake_token") : null;
  if (!token) {
    throw new Error("Authentication required. Please sign in as a Brand to post a brief.");
  }

  const res = await fetch(getApiUrl("/api/briefs"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(brief),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Failed to publish brief (${res.status})`);
  }

  const savedBrief: Brief = await res.json();
  inMemoryBriefs.set(savedBrief.id, savedBrief);
  return savedBrief;
}

export async function fetchAllBriefs(): Promise<Brief[]> {
  try {
    const res = await fetch(getApiUrl("/api/briefs"));
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.briefs) && data.briefs.length > 0) {
        data.briefs.forEach((b: Brief) => inMemoryBriefs.set(b.id, b));
        return data.briefs;
      }
    }
  } catch {}
  return getAllBriefs();
}

export function getAllBriefs(): Brief[] {
  const result: Brief[] = Array.from(inMemoryBriefs.values());

  if (typeof window !== "undefined") {
    try {
      const stored = JSON.parse(localStorage.getItem("retake_briefs") || "{}");
      Object.values(stored).forEach((b) => {
        const brief = b as Brief;
        if (!result.some((existing) => existing.id === brief.id)) {
          result.push(brief);
        }
      });
    } catch {
      // Ignore storage read issues
    }
  }

  return result;
}

function getApiUrl(path: string): string {
  if (typeof window !== "undefined") {
    return path;
  }
  const baseUrl = process.env.API_BASE_URL || "http://localhost:3001";
  return `${baseUrl}${path}`;
}

export async function fetchCreators(params: SearchParams): Promise<SearchResponse> {
  if (USE_REAL_API) {
    try {
      const searchParams = new URLSearchParams();
      if (params.q) searchParams.set("q", params.q);
      if (params.specialization?.length) {
        params.specialization.forEach((s) => searchParams.append("specialization", s));
      }
      if (params.tool?.length) {
        params.tool.forEach((t) => searchParams.append("tool", t));
      }
      if (params.contentType?.length) {
        params.contentType.forEach((ct) => searchParams.append("contentType", ct));
      }
      if (params.format?.length) {
        params.format.forEach((f) => searchParams.append("format", f));
      }
      if (params.availability) searchParams.set("availability", params.availability);
      if (params.maxPriceInr) searchParams.set("maxPriceInr", String(params.maxPriceInr));
      if (params.verifiedToolsOnly) searchParams.set("verifiedToolsOnly", "true");
      if (params.sort) searchParams.set("sort", params.sort);

      const res = await fetch(getApiUrl(`/api/creators?${searchParams.toString()}`));
      if (res.ok) {
        return res.json();
      }
    } catch {
      // Fall through to in-memory search
    }
  }

  // Instant in-memory mock search across all platform Indian and international creators
  return executeSearch(allPlatformCreators, params);
}

export async function fetchCreatorByHandle(handle: string): Promise<Creator | null> {
  if (USE_REAL_API) {
    try {
      const res = await fetch(getApiUrl(`/api/creators/${handle}`));
      if (res.ok) {
        return res.json();
      }
    } catch {
      // Fall through to in-memory lookup
    }
  }

  const normalized = (handle || "").toLowerCase().replace(/\./g, "-");

  // Specific alias mappings to prevent 404s
  if (normalized === "creator-devin" || normalized === "creator-dev" || normalized === "devin") {
    const devCreator = allPlatformCreators.find((c) => c.id === "creator-dev" || c.handle === "dev-verma");
    if (devCreator) return devCreator;
  }
  if (normalized === "creator-arjun" || normalized === "arjun-patel" || normalized === "arjun") {
    const arjunCreator = allPlatformCreators.find((c) => c.id === "creator-arjun" || c.handle === "arjun-patel");
    if (arjunCreator) return arjunCreator;
  }

  const creator = allPlatformCreators.find(
    (c) =>
      c.handle.toLowerCase() === handle.toLowerCase() ||
      c.handle.toLowerCase() === normalized ||
      c.handle.toLowerCase().replace(/-/g, ".") === handle.toLowerCase() ||
      c.id.toLowerCase() === handle.toLowerCase()
  );
  return creator || null;
}

export async function createBriefDraft(idea: string): Promise<DraftBriefResult> {
  if (USE_REAL_API) {
    try {
      const res = await fetch(getApiUrl("/api/briefs/draft"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea }),
      });
      if (res.ok) {
        return res.json();
      }
    } catch {
      // Fall through to parseBriefDraft
    }
  }

  return parseBriefDraft(idea);
}

export async function fetchBriefById(briefId: string): Promise<Brief> {
  if (USE_REAL_API) {
    try {
      const res = await fetch(getApiUrl(`/api/briefs/${briefId}`));
      if (res.ok) {
        return res.json();
      }
    } catch {
      // Fall through to in-memory fallback
    }
  }

  if (inMemoryBriefs.has(briefId)) {
    return inMemoryBriefs.get(briefId)!;
  }

  if (typeof window !== "undefined") {
    try {
      const stored = JSON.parse(localStorage.getItem("retake_briefs") || "{}");
      if (stored[briefId]) {
        return stored[briefId] as Brief;
      }
    } catch {}
  }

  return inMemoryBriefs.get("brief-zomato-midnight") || goldenBrief;
}

export async function fetchBriefMatches(briefId: string): Promise<MatchResult[]> {
  if (USE_REAL_API) {
    try {
      const res = await fetch(getApiUrl(`/api/briefs/${briefId}/matches`));
      if (res.ok) {
        return res.json();
      }
    } catch {
      // Fall through to rankCreatorsForBrief
    }
  }

  const brief = await fetchBriefById(briefId);
  return rankCreatorsForBrief(brief, allPlatformCreators);
}

function getAuthHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("retake_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface ApplicationProposal {
  id: string;
  briefId: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string;
  creatorSpecialization?: string;
  proposedPriceInr: number;
  deliveryDays: number;
  proposalText: string;
  relevantTools: string[];
  status: "submitted" | "under_review" | "shortlisted" | "accepted" | "rejected" | "withdrawn";
  createdAt: string;
}

export async function fetchApplicationsForBrief(briefId: string): Promise<ApplicationProposal[]> {
  try {
    const res = await fetch(getApiUrl(`/api/briefs/${briefId}/applications`), {
      headers: { ...getAuthHeader() },
    });
    if (res.ok) {
      const data = await res.json();
      return (data.applications || []) as ApplicationProposal[];
    }
  } catch {}
  return [];
}

export async function submitProposalToBrief(
  briefId: string,
  payload: {
    proposedPriceInr: number;
    deliveryDays: number;
    proposalText: string;
    relevantTools?: string[];
  }
): Promise<ApplicationProposal> {
  const res = await fetch(getApiUrl(`/api/briefs/${briefId}/applications`), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to submit proposal");
  return data.application || data;
}

export async function updateProposalStatus(
  briefId: string,
  appId: string,
  status: "submitted" | "under_review" | "shortlisted" | "accepted" | "rejected"
): Promise<{ success: boolean; application?: ApplicationProposal; order?: unknown }> {
  const res = await fetch(getApiUrl(`/api/briefs/${briefId}/applications/${appId}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify({ status }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to update proposal");
  return data;
}

export interface CreatorVerification {
  id: string;
  creatorId?: string;
  creatorName?: string;
  category: "tools_evidence" | "workflow_evidence" | "identity" | "completed_project" | string;
  evidenceText: string;
  evidenceUrls?: string[];
  status: "pending" | "approved" | "rejected" | string;
  decisionReason?: string;
  createdAt?: string;
}

export interface VerificationItem {
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

export interface AdminMetrics {
  creators: number;
  brands: number;
  briefs: number;
  projects: number;
  pendingVerifications: number;
  pendingReports: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "brand" | "creator" | "admin";
  status: "active" | "suspended";
  company?: string;
  createdAt: string;
}

export interface ModerationReport {
  id: string;
  resourceType: "portfolio" | "brief" | "user" | "message";
  resourceId: string;
  reason: string;
  status: "pending" | "resolved" | "dismissed";
  resolutionNotes?: string;
  createdAt: string;
}

export async function fetchSavedCreators(): Promise<Creator[]> {
  try {
    const res = await fetch(getApiUrl("/api/creators/saved"), {
      headers: { ...getAuthHeader() },
    });
    if (res.ok) {
      const data = await res.json();
      return (data.saved || []) as Creator[];
    }
  } catch {}
  return [];
}

export async function saveCreatorToShortlist(creatorId: string): Promise<void> {
  await fetch(getApiUrl(`/api/creators/saved/${creatorId}`), {
    method: "POST",
    headers: { ...getAuthHeader() },
  });
}

export async function removeCreatorFromShortlist(creatorId: string): Promise<void> {
  await fetch(getApiUrl(`/api/creators/saved/${creatorId}`), {
    method: "DELETE",
    headers: { ...getAuthHeader() },
  });
}

export async function addPortfolioProject(
  creatorId: string,
  project: Partial<PortfolioPiece> | Record<string, unknown>
): Promise<PortfolioPiece> {
  const res = await fetch(getApiUrl(`/api/creators/${creatorId}/portfolio`), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(project),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to add portfolio project");
  return data;
}

export async function deletePortfolioProject(creatorId: string, projectId: string): Promise<void> {
  const res = await fetch(getApiUrl(`/api/creators/${creatorId}/portfolio/${projectId}`), {
    method: "DELETE",
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) throw new Error("Failed to delete project");
}

export async function submitVerificationRequest(
  creatorId: string,
  payload: Record<string, unknown>
): Promise<CreatorVerification> {
  const res = await fetch(getApiUrl(`/api/creators/${creatorId}/verifications`), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to submit verification request");
  return data;
}

export async function fetchCreatorVerifications(creatorId: string): Promise<CreatorVerification[]> {
  try {
    const res = await fetch(getApiUrl(`/api/creators/${creatorId}/verifications`), {
      headers: { ...getAuthHeader() },
    });
    if (res.ok) {
      const data = await res.json();
      return (data.verifications || []) as CreatorVerification[];
    }
  } catch {}
  return [];
}

export async function fetchAdminMetrics(): Promise<AdminMetrics> {
  const res = await fetch(getApiUrl("/api/admin/metrics"), {
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) throw new Error("Failed to load admin metrics");
  return res.json();
}

export async function fetchAdminUsers(q?: string): Promise<AdminUser[]> {
  const url = q ? `/api/admin/users?q=${encodeURIComponent(q)}` : "/api/admin/users";
  const res = await fetch(getApiUrl(url), {
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) throw new Error("Failed to load users");
  const data = await res.json();
  return (data.users || []) as AdminUser[];
}

export async function updateAdminUserStatus(userId: string, status: string): Promise<void> {
  const res = await fetch(getApiUrl(`/api/admin/users/${userId}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update user status");
}

export async function fetchAdminVerifications(status?: string): Promise<VerificationItem[]> {
  const url = status ? `/api/admin/verifications?status=${status}` : "/api/admin/verifications";
  const res = await fetch(getApiUrl(url), {
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) throw new Error("Failed to load verifications");
  const data = await res.json();
  return (data.verifications || []) as VerificationItem[];
}

export async function reviewAdminVerification(verId: string, status: string, decisionReason: string): Promise<void> {
  const res = await fetch(getApiUrl(`/api/admin/verifications/${verId}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify({ status, decisionReason }),
  });
  if (!res.ok) throw new Error("Failed to update verification");
}

export async function fetchAdminReports(): Promise<ModerationReport[]> {
  const res = await fetch(getApiUrl("/api/admin/reports"), {
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) throw new Error("Failed to load reports");
  const data = await res.json();
  return (data.reports || []) as ModerationReport[];
}

export async function resolveAdminReport(reportId: string, status: string, resolutionNotes: string): Promise<void> {
  const res = await fetch(getApiUrl(`/api/admin/reports/${reportId}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify({ status, resolutionNotes }),
  });
  if (!res.ok) throw new Error("Failed to resolve report");
}
