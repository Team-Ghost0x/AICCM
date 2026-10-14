export interface ProductionOrder {
  id: string;
  briefId: string;
  projectTitle: string;
  brandName: string;
  creatorName: string;
  creatorHandle: string;
  amountInr: number;
  status: "hired" | "in_production" | "in_review" | "revision_requested" | "approved" | "completed";
  deadline: string;
  createdAt: string;
  deliverablesCount: number;
  currentTakeNumber?: number;
}

const STORAGE_KEY = "aiccm_production_orders_v1";

const DEFAULT_ORDERS: ProductionOrder[] = [
  {
    id: "ord-cyberpunk-001",
    briefId: "brief-cyberpunk-teaser",
    projectTitle: "NEO-SHINJUKU 2099 Cyberpunk Teaser",
    brandName: "Acme Footwear Ltd",
    creatorName: "Mira Okonkwo",
    creatorHandle: "mira-motion",
    amountInr: 85000,
    status: "in_review",
    deadline: new Date(Date.now() + 5 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    deliverablesCount: 3,
    currentTakeNumber: 24,
  },
  {
    id: "ord-kinetic-002",
    briefId: "brief-kinetic-app",
    projectTitle: "Kinetic UI Generative Film",
    brandName: "FinPulse Global",
    creatorName: "Devin Vance",
    creatorHandle: "devin-vance",
    amountInr: 65000,
    status: "in_production",
    deadline: new Date(Date.now() + 9 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    deliverablesCount: 2,
    currentTakeNumber: 12,
  },
];

export function getProductionOrders(): ProductionOrder[] {
  if (typeof window === "undefined") return DEFAULT_ORDERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ORDERS));
    return DEFAULT_ORDERS;
  } catch {
    return DEFAULT_ORDERS;
  }
}

export function saveProductionOrders(orders: ProductionOrder[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch {
    // Ignore storage issues in test/restricted environment
  }
}

export function createProductionOrder(partial: Partial<ProductionOrder>): ProductionOrder {
  const current = getProductionOrders();
  const newOrder: ProductionOrder = {
    id: partial.id || `ord-${Date.now().toString(36)}`,
    briefId: partial.briefId || "brief-general",
    projectTitle: partial.projectTitle || "New Creative Project",
    brandName: partial.brandName || "Brand Agency",
    creatorName: partial.creatorName || "AI Creator",
    creatorHandle: partial.creatorHandle || "creator",
    amountInr: partial.amountInr || 50000,
    status: partial.status || "hired",
    deadline: partial.deadline || new Date(Date.now() + 7 * 86400000).toISOString(),
    createdAt: new Date().toISOString(),
    deliverablesCount: partial.deliverablesCount || 1,
    currentTakeNumber: 1,
  };

  const updated = [newOrder, ...current];
  saveProductionOrders(updated);
  return newOrder;
}

export function updateProductionOrderStatus(orderId: string, status: ProductionOrder["status"]): void {
  const current = getProductionOrders();
  const updated = current.map((ord) => (ord.id === orderId ? { ...ord, status } : ord));
  saveProductionOrders(updated);
}
