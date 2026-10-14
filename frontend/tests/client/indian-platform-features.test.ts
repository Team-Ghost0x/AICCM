import { describe, it, expect, beforeEach } from "vitest";
import {
  indianClients,
  indianCreators,
  allPlatformCreators,
  indianBriefs,
  initialCommunicationRequests,
  initialMessageThreads,
} from "@/lib/contract/fixtures";
import {
  getClientById,
  getCreatorById,
  getAllThreads,
  getAllRequests,
  sendCommunicationRequest,
  sendCreatorToClientPitch,
  acceptCommunicationRequest,
  declineCommunicationRequest,
  resetToDefaultData,
} from "@/lib/client/messages";
import { getCurrentUser, switchRole, User } from "@/lib/client/auth";

describe("Indian Creators & Clients Platform Suite", () => {
  beforeEach(() => {
    localStorage.clear();
    resetToDefaultData();
  });

  describe("Indian Data Synchronization & Integrity", () => {
    it("provides authentic Indian enterprise clients with valid balances and companies", () => {
      expect(indianClients.length).toBeGreaterThanOrEqual(5);

      const zomatoClient = indianClients.find((c) => c.id === "client-vikram");
      expect(zomatoClient).toBeDefined();
      expect(zomatoClient?.name).toBe("Vikram Sharma");
      expect(zomatoClient?.brandName).toBe("Zomato Studios");
      expect(zomatoClient?.balanceInr).toBeGreaterThan(0);

      const nykaaClient = indianClients.find((c) => c.id === "client-ananya");
      expect(nykaaClient?.name).toBe("Ananya Roy");
      expect(nykaaClient?.brandName).toBe("Nykaa");

      const tataClient = indianClients.find((c) => c.id === "client-rohan");
      expect(tataClient?.name).toBe("Rohan Mehra");
      expect(tataClient?.brandName).toBe("Tata Neu");
    });

    it("provides authentic Indian AI directors with verified tool stacks and locations", () => {
      expect(indianCreators.length).toBeGreaterThanOrEqual(5);

      const arjun = indianCreators.find((c) => c.id === "creator-arjun");
      expect(arjun?.displayName).toBe("Arjun Patel");
      expect(arjun?.location).toContain("India");
      expect(arjun?.tools.some((t) => t.name === "Kling" || t.toolId === "kling")).toBe(true);

      const kabir = indianCreators.find((c) => c.id === "creator-kabir");
      expect(kabir?.displayName).toBe("Kabir Nair");
      expect(kabir?.location).toContain("Kochi / Bengaluru");

      const neha = indianCreators.find((c) => c.id === "creator-neha");
      expect(neha?.displayName).toBe("Neha Sengupta");
    });

    it("includes comprehensive Indian brand briefs with INR budgets", () => {
      expect(indianBriefs.length).toBeGreaterThanOrEqual(4);
      const midnightBrief = indianBriefs.find((b) => b.id === "brief-zomato-midnight");
      expect(midnightBrief).toBeDefined();
      expect(midnightBrief?.brandName).toBe("Zomato Studios");
      expect(midnightBrief?.budgetInr?.min).toBe(40000);
      expect(midnightBrief?.budgetInr?.max).toBe(60000);
    });
  });

  describe("Mutual Bidirectional Communication (Client <-> Creator)", () => {
    it("allows a Client to request communication with an AI Creator", () => {
      const clientUser: User = {
        id: "client-vikram",
        name: "Vikram Sharma",
        email: "vikram@zomatostudios.com",
        company: "Zomato Studios",
        role: "brand",
        balanceInr: 350000,
        credits: 24,
        provider: "google",
      };

      const targetCreator = allPlatformCreators.find((c) => c.id === "creator-arjun")!;
      expect(targetCreator).toBeDefined();

      const { request, thread } = sendCommunicationRequest({
        fromUser: clientUser,
        toCreator: targetCreator,
        projectTitle: "Biryani Express 15s Sizzle",
        proposedBudgetInr: 50000,
        targetDeadline: "2026-10-30",
        message: "Hi Arjun, we need high-energy vertical cuts for late-night delivery.",
      });

      expect(request.fromUserId).toBe("client-vikram");
      expect(request.toUserId).toBe("creator-arjun");
      expect(request.fromUserRole).toBe("brand");
      expect(request.toUserRole).toBe("creator");
      expect(request.status).toBe("pending");

      expect(thread.id).toBeDefined();
      expect(thread.projectTitle).toBe("Biryani Express 15s Sizzle");
      expect(thread.messages.length).toBe(1);
      expect(thread.messages[0].text).toContain("high-energy vertical cuts");

      // Verify persistence in localStorage
      const allThreads = getAllThreads();
      expect(allThreads.some((t) => t.id === thread.id)).toBe(true);
    });

    it("allows an AI Creator to pitch directly to an Enterprise Brand", () => {
      const creatorUser: User = {
        id: "creator-kabir",
        name: "Kabir Nair",
        email: "kabir@retake.market",
        company: "Neural Cinema Labs",
        role: "creator",
        balanceInr: 125000,
        credits: 50,
        provider: "google",
      };

      const targetClient = indianClients.find((c) => c.id === "client-rohan")!;
      expect(targetClient).toBeDefined();

      const { request, thread } = sendCreatorToClientPitch({
        fromCreatorUser: creatorUser,
        toClient: targetClient,
        projectTitle: "Connected Bengaluru 2030 Teaser Pitch",
        proposedBudgetInr: 110000,
        targetDeadline: "2026-11-15",
        message: "Hi Rohan! I have developed an autonomous traffic neural sequence.",
        takeAttachment: {
          title: "Take 01: Aerial Highway Flythrough",
          url: "/media/pieces/piece-2.jpg",
          takeNumber: 1,
          details: "Runway Gen-3 camera sweep with neural VFX",
        },
      });

      expect(request.fromUserId).toBe("creator-kabir");
      expect(request.toUserId).toBe("client-rohan");
      expect(request.fromUserRole).toBe("creator");
      expect(request.toUserRole).toBe("brand");
      expect(request.status).toBe("pending");

      expect(thread.messages[0].attachments?.length).toBe(1);
      expect(thread.messages[0].attachments?.[0].title).toBe("Take 01: Aerial Highway Flythrough");
    });

    it("handles request acceptance and milestone activation cleanly", () => {
      const threads = getAllThreads();
      const pendingThread = threads.find((t) => t.status === "pending") || threads[0];

      const accepted = acceptCommunicationRequest(pendingThread.id);
      expect(accepted).not.toBeNull();
      expect(accepted?.status).toBe("accepted");
      expect(accepted?.messages.some((m) => m.text.includes("Milestone escrow pipeline is now enabled"))).toBe(true);

      const refreshed = getAllThreads().find((t) => t.id === pendingThread.id);
      expect(refreshed?.status).toBe("accepted");
    });

    it("handles request decline cleanly", () => {
      const threads = getAllThreads();
      const targetThread = threads[0];

      const declined = declineCommunicationRequest(targetThread.id);
      expect(declined).not.toBeNull();
      expect(declined?.status).toBe("declined");

      const refreshed = getAllThreads().find((t) => t.id === targetThread.id);
      expect(refreshed?.status).toBe("declined");
    });
  });

  describe("Admin & Developer Role Integration", () => {
    it("switches to developer admin role with platform privileges", () => {
      const admin = switchRole("admin");
      expect(admin.role).toBe("admin");
      expect(admin.name).toBe("Aditya Rao");
      expect(admin.email).toBe("aditya.dev@retake.internal");

      const current = getCurrentUser();
      expect(current?.role).toBe("admin");
    });

    it("resets seed data to default synchronized Indian dataset", () => {
      // Modify threads
      const clientUser: User = {
        id: "client-vikram",
        name: "Vikram Sharma",
        email: "vikram@zomatostudios.com",
        company: "Zomato Studios",
        role: "brand",
        balanceInr: 350000,
        credits: 24,
        provider: "google",
      };

      sendCommunicationRequest({
        fromUser: clientUser,
        toCreator: allPlatformCreators[1],
        projectTitle: "Temporary Project",
        message: "Hello",
      });

      expect(getAllRequests().length).toBeGreaterThan(initialCommunicationRequests.length);

      // Reset
      resetToDefaultData();
      expect(getAllRequests().length).toBe(initialCommunicationRequests.length);
      expect(getAllThreads().length).toBe(initialMessageThreads.length);
    });

    it("retrieves client and creator by ID accurately", () => {
      const client = getClientById("client-ananya");
      expect(client).toBeDefined();
      expect(client?.brandName).toBe("Nykaa");

      const creator = getCreatorById("creator-kabir");
      expect(creator).toBeDefined();
      expect(creator?.displayName).toBe("Kabir Nair");
    });
  });
});
