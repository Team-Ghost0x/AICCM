"use client";

export type UserRole = "brand" | "creator" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  company?: string;
  avatarUrl?: string;
  role: UserRole;
  balanceInr: number;
  credits: number;
  provider: "google" | "email";
}

const STORAGE_KEY = "retake_auth_user_v2";

export const DEFAULT_BRAND_USER: User = {
  id: "client-vikram",
  name: "Vikram Sharma",
  email: "vikram.sharma@zomatostudios.com",
  company: "Zomato Studios",
  role: "brand",
  balanceInr: 350000,
  credits: 24,
  provider: "email",
};

export const DEFAULT_CREATOR_USER: User = {
  id: "creator-arjun",
  name: "Arjun Patel",
  email: "arjun@retake.market",
  company: "Kinetic Motion AI Lab",
  role: "creator",
  balanceInr: 125000,
  credits: 50,
  provider: "email",
};

export const DEFAULT_ADMIN_USER: User = {
  id: "admin-aditya",
  name: "Aditya Rao",
  email: "aditya.dev@retake.internal",
  company: "Retake Platform Core",
  role: "admin",
  balanceInr: 1480000,
  credits: 999,
  provider: "email",
};

type AuthListener = (user: User | null) => void;
const listeners = new Set<AuthListener>();

function notifyListeners(user: User | null) {
  listeners.forEach((listener) => {
    try {
      listener(user);
    } catch {
      // Ignore listener error
    }
  });
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const token = localStorage.getItem("retake_token");
    // If not in Vitest test environment and no token exists, user is not logged in.
    // Clear any stale unauthenticated mock objects left over from dev tests.
    if (!token && process.env.NODE_ENV !== "test") {
      if (localStorage.getItem(STORAGE_KEY)) {
        localStorage.removeItem(STORAGE_KEY);
      }
      return null;
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.email || !parsed.role) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveCurrentUser(user: User | null): void {
  if (typeof window === "undefined") return;
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem("retake_token");
    }
    notifyListeners(user);
  } catch {
    // Ignore storage errors in restricted contexts
  }
}

export function loginWithGoogle(role: UserRole = "brand"): User {
  let base = DEFAULT_BRAND_USER;
  if (role === "creator") base = DEFAULT_CREATOR_USER;
  if (role === "admin") base = DEFAULT_ADMIN_USER;

  const loggedInUser: User = {
    ...base,
    id: `${role}-${Date.now()}`,
    provider: "google",
  };
  if (typeof window !== "undefined") {
    localStorage.setItem("retake_token", `tok_${Date.now()}`);
  }
  saveCurrentUser(loggedInUser);
  return loggedInUser;
}

export function loginWithEmail(
  email: string,
  name: string = "Studio Partner",
  role: UserRole = "brand"
): User {
  const loggedInUser: User = {
    id: `email-${Date.now()}`,
    name,
    email,
    role,
    balanceInr: role === "admin" ? 1480000 : role === "brand" ? 250000 : 50000,
    credits: 20,
    provider: "email",
  };
  if (typeof window !== "undefined") {
    localStorage.setItem("retake_token", `tok_${Date.now()}`);
  }
  saveCurrentUser(loggedInUser);
  return loggedInUser;
}

export async function syncSessionWithBackend(): Promise<User | null> {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("retake_token");
  if (!token) {
    if (process.env.NODE_ENV !== "test" && localStorage.getItem(STORAGE_KEY)) {
      saveCurrentUser(null);
    }
    return null;
  }

  // If token is a mock token (e.g. from test or manual fallback), keep current user
  if (token.startsWith("tok_")) {
    return getCurrentUser();
  }

  try {
    const res = await fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      const verifiedUser: User = {
        id: data.id,
        name: data.name,
        email: data.email,
        company: data.company,
        role: data.role as UserRole,
        balanceInr: data.balanceInr || 0,
        credits: data.credits || 0,
        provider: "email",
      };
      saveCurrentUser(verifiedUser);
      return verifiedUser;
    } else if (res.status === 401 || res.status === 403) {
      // Token is invalid/revoked in backend
      await logout();
      return null;
    }
  } catch {
    // Backend offline / network error - retain cached user
    return getCurrentUser();
  }
  return getCurrentUser();
}

export async function registerWithBackend(
  name: string,
  email: string,
  password: string,
  role: UserRole,
  company?: string
): Promise<User> {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, role, company }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Registration failed. Please check your details.");
  }
  if (typeof window !== "undefined" && data.token) {
    localStorage.setItem("retake_token", data.token);
  }
  const loggedInUser: User = {
    id: data.user.id,
    name: data.user.name,
    email: data.user.email,
    company: data.user.company,
    role: data.user.role as UserRole,
    balanceInr: data.user.balanceInr || 0,
    credits: data.user.credits || 100,
    provider: "email",
  };
  saveCurrentUser(loggedInUser);
  return loggedInUser;
}

export async function loginWithBackend(
  email: string,
  password: string = "password",
  role?: UserRole
): Promise<User> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, role }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Invalid credentials. Please verify your email and password.");
  }
  if (typeof window !== "undefined" && data.token) {
    localStorage.setItem("retake_token", data.token);
  }
  const loggedInUser: User = {
    id: data.user.id,
    name: data.user.name,
    email: data.user.email,
    company: data.user.company,
    role: data.user.role as UserRole,
    balanceInr: data.user.balanceInr || 0,
    credits: data.user.credits || 100,
    provider: "email",
  };
  saveCurrentUser(loggedInUser);
  return loggedInUser;
}

export function logout(): void {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("retake_token");
    if (token) {
      try {
        fetch("/api/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      } catch {}
      localStorage.removeItem("retake_token");
    }
    localStorage.removeItem("aiccm_token");
  }
  saveCurrentUser(null);
}

export function switchRole(role: UserRole): User {
  let updated: User;
  if (role === "admin") {
    updated = { ...DEFAULT_ADMIN_USER };
  } else if (role === "creator") {
    updated = { ...DEFAULT_CREATOR_USER };
  } else {
    updated = { ...DEFAULT_BRAND_USER };
  }

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("retake_token");
    if (token) {
      fetch("/api/auth/role", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role }),
      }).catch(() => {});
    }
  }

  saveCurrentUser(updated);
  return updated;
}

export function addFunds(amountInr: number): User | null {
  const current = getCurrentUser();
  if (!current) return null;
  const updated: User = {
    ...current,
    balanceInr: current.balanceInr + amountInr,
  };
  saveCurrentUser(updated);
  return updated;
}

export function deductFunds(amountInr: number): User | null {
  const current = getCurrentUser();
  if (!current || current.balanceInr < amountInr) return null;
  const updated: User = {
    ...current,
    balanceInr: current.balanceInr - amountInr,
  };
  saveCurrentUser(updated);
  return updated;
}

export function onAuthChange(callback: AuthListener): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}
