import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createCaller } from "./_core/trpc";
import { getDb } from "./db";
import { eq } from "drizzle-orm";
import { clients, lawFirms, users } from "../drizzle/schema";

describe("Clients Router", () => {
  let testLawFirmId: number;
  let testUserId: number;
  let testClientId: number;
  const mockUser = {
    id: 998,
    openId: "test-user-998",
    name: "Test User",
    email: "test@example.com",
    role: "admin" as const,
    lawFirmId: 998,
    loginMethod: "test",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  beforeAll(async () => {
    // Create test law firm
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const lawFirmResult = await db.insert(lawFirms).values({
      name: "Test Law Firm Clients",
      email: "firm-clients@test.com",
      phone: "1234567890",
      address: "123 Test St",
      city: "Test City",
      country: "Test Country",
      licenseNumber: `LIC-CLIENTS-${Date.now()}`,
    });
    testLawFirmId = (lawFirmResult as any)[0];

    // Create test user
    const userResult = await db!.insert(users).values({
      openId: `test-user-clients-${Date.now()}`,
      name: "Test Lawyer",
      email: "lawyer-clients@test.com",
      role: "lawyer",
      lawFirmId: testLawFirmId,
      loginMethod: "test",
    });
    testUserId = (userResult as any)[0];
  });

  afterAll(async () => {
    // Clean up test data
    const db = await getDb();
    if (!db) return;
    if (testClientId) {
      await db.delete(clients).where(eq(clients.id, testClientId));
    }
    if (testUserId) {
      await db.delete(users).where(eq(users.id, testUserId));
    }
    if (testLawFirmId) {
      await db.delete(lawFirms).where(eq(lawFirms.id, testLawFirmId));
    }
  });

  describe("clients.list", () => {
    it("should return clients for the user's law firm", async () => {
      const caller = createCaller({
        user: { ...mockUser, lawFirmId: testLawFirmId },
        req: { headers: {} } as any,
        res: {} as any,
      });

      const result = await caller.clients.list();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("clients.create", () => {
    it("should create a new client", async () => {
      const caller = createCaller({
        user: { ...mockUser, lawFirmId: testLawFirmId },
        req: { headers: {} } as any,
        res: {} as any,
      });

      const result = await caller.clients.create({
        name: "Test Client",
        email: "client@test.com",
        phone: "9876543210",
        address: "456 Client St",
        city: "Client City",
        clientType: "individual",
      });

      expect(result).toBeDefined();
      expect(result.name).toBe("Test Client");
      expect(result.email).toBe("client@test.com");
      expect(result.clientType).toBe("individual");
      expect(result.lawFirmId).toBe(testLawFirmId);
      expect(result.kycStatus).toBe("pending");
      expect(result.conflictCheckStatus).toBe("pending");
      testClientId = result.id;
    });

    it("should create a company client", async () => {
      const caller = createCaller({
        user: { ...mockUser, lawFirmId: testLawFirmId },
        req: { headers: {} } as any,
        res: {} as any,
      });

      const result = await caller.clients.create({
        name: "Test Company",
        email: "company@test.com",
        phone: "1111111111",
        address: "789 Company St",
        city: "Company City",
        clientType: "company",
      });

      expect(result).toBeDefined();
      expect(result.name).toBe("Test Company");
      expect(result.clientType).toBe("company");
    });

    it("should require a client name", async () => {
      const caller = createCaller({
        user: { ...mockUser, lawFirmId: testLawFirmId },
        req: { headers: {} } as any,
        res: {} as any,
      });

      try {
        await caller.clients.create({
          name: "",
          email: "client@test.com",
          clientType: "individual",
        });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("clients.get", () => {
    it("should retrieve a specific client", async () => {
      if (!testClientId) {
        // Create a client first
        const caller = createCaller({
          user: { ...mockUser, lawFirmId: testLawFirmId },
          req: { headers: {} } as any,
          res: {} as any,
        });

        const dbConn = await getDb();
        if (!dbConn) throw new Error("Database not available");
        const result = await caller.clients.create({
          name: "Test Client for Get",
          email: "client-get@test.com",
          clientType: "individual",
        });
        testClientId = result.id;
      }

      const caller = createCaller({
        user: { ...mockUser, lawFirmId: testLawFirmId },
        req: { headers: {} } as any,
        res: {} as any,
      });

      const result = await caller.clients.get(testClientId);
      expect(result).toBeDefined();
      expect(result.id).toBe(testClientId);
      expect(result.lawFirmId).toBe(testLawFirmId);
    });

    it("should throw NOT_FOUND for non-existent client", async () => {
      const caller = createCaller({
        user: { ...mockUser, lawFirmId: testLawFirmId },
        req: { headers: {} } as any,
        res: {} as any,
      });

      try {
        await caller.clients.get(99999);
        expect.fail("Should have thrown NOT_FOUND error");
      } catch (error: any) {
        expect(error.code).toBe("NOT_FOUND");
      }
    });
  });

  describe("clients.update", () => {
    it("should update a client", async () => {
      if (!testClientId) {
        // Create a client first
        const caller = createCaller({
          user: { ...mockUser, lawFirmId: testLawFirmId },
          req: { headers: {} } as any,
          res: {} as any,
        });

        const dbConn = await getDb();
        if (!dbConn) throw new Error("Database not available");
        const result = await caller.clients.create({
          name: "Test Client for Update",
          email: "client-update@test.com",
          clientType: "individual",
        });
        testClientId = result.id;
      }

      const caller = createCaller({
        user: { ...mockUser, lawFirmId: testLawFirmId },
        req: { headers: {} } as any,
        res: {} as any,
      });

      const result = await caller.clients.update({
        id: testClientId,
        name: "Updated Client Name",
        kycStatus: "approved",
      });

      expect(result).toBeDefined();
      expect(result.name).toBe("Updated Client Name");
      expect(result.kycStatus).toBe("approved");
    });
  });

  describe("clients.conflictCheck", () => {
    it("should mark conflict check as pending", async () => {
      if (!testClientId) {
        // Create a client first
        const caller = createCaller({
          user: { ...mockUser, lawFirmId: testLawFirmId },
          req: { headers: {} } as any,
          res: {} as any,
        });

        const dbConn = await getDb();
        if (!dbConn) throw new Error("Database not available");
        const result = await caller.clients.create({
          name: "Test Client for Conflict",
          email: "client-conflict@test.com",
          clientType: "individual",
        });
        testClientId = result.id;
      }

      const caller = createCaller({
        user: { ...mockUser, lawFirmId: testLawFirmId },
        req: { headers: {} } as any,
        res: {} as any,
      });

      const result = await caller.clients.conflictCheck(testClientId);
      expect(result).toBeDefined();
      expect(result.conflictCheckStatus).toBe("pending");
    });
  });

  describe("clients.kycCheck", () => {
    it("should mark KYC as pending", async () => {
      if (!testClientId) {
        // Create a client first
        const caller = createCaller({
          user: { ...mockUser, lawFirmId: testLawFirmId },
          req: { headers: {} } as any,
          res: {} as any,
        });

        const dbConn = await getDb();
        if (!dbConn) throw new Error("Database not available");
        const result = await caller.clients.create({
          name: "Test Client for KYC",
          email: "client-kyc@test.com",
          clientType: "individual",
        });
        testClientId = result.id;
      }

      const caller = createCaller({
        user: { ...mockUser, lawFirmId: testLawFirmId },
        req: { headers: {} } as any,
        res: {} as any,
      });

      const result = await caller.clients.kycCheck(testClientId);
      expect(result).toBeDefined();
      expect(result.kycStatus).toBe("pending");
    });
  });
});
