import { vi } from "vitest";

// Mock next/navigation for JSDOM test environments
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    pathname: "/",
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));
