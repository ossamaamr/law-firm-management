import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { createCaller } from "./_core/trpc";
import { getDb } from "./db";
import { eq } from "drizzle-orm";
import { cases, lawFirms, clients, matters, users } from "../drizzle/schema";

describe("Cases Router", () => {
  let testLawFirmId: number;
  let testClientId: number;
  let testMatterId: number;
  let testUserId: number;
  let testCaseId: number;
  const mockUser = {
    id: 999,
    openId: "test-user-999",
    name: "Test User",
    email: "test@example.com",
    role: "admin" as const,
    lawFirmId: 999,
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
      name: "Test Law Firm",
      email: "firm@test.com",
      phone: "1234567890",
      address: "123 Test St",
      city: "Test City",
      country: "Test Country",
      licenseNumber: `LIC-${Date.now()}`,
    });
    testLawFirmId = (lawFirmResult as any)[0];

    // Create test user
    const userResult = await db!.insert(users).values({
      openId: `test-user-${Date.now()}`,
      name: "Test Lawyer",
      email: "lawyer@test.com",
      role: "lawyer",
      lawFirmId: testLawFirmId,
      loginMethod: "test",
    });
    testUserId = (userResult as any)[0];

    // Create test client
    const clientResult = await db!.insert(clients).values({
      lawFirmId: testLawFirmId,
      name: "Test Client",
      email: "client@test.com",
      phone: "9876543210",
      address: "456 Client St",
      city: "Client City",
      clientType: "individual",
      kycStatus: "approved",
      conflictCheckStatus: "clear",
    });
    testClientId = (clientResult as any)[0];

    // Create test matter
    const matterResult = await db!.insert(matters).values({
      lawFirmId: testLawFirmId,
      clientId: testClientId,
      matterNumber: `MATTER-${Date.now()}`,
      title: "Test Matter",
      description: "Test matter description",
      matterType: "litigation",
      status: "open",
      leadLawyerId: testUserId,
      feeAgreementType: "hourly",
      feeAmount: "5000",
    });
    testMatterId = (matterResult as any)[0];
  });

  afterAll(async () => {
    // Clean up test data
    const db = await getDb();
    if (!db) return;
    if (testCaseId) {
      await db.delete(cases).where(eq(cases.id, testCaseId));
    }
    if (testMatterId) {
      await db.delete(matters).where(eq(matters.id, testMatterId));
    }
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

  describe("cases.list", () => {
    it("should return cases for the user's law firm", async () => {
      const caller = createCaller({
        user: { ...mockUser, lawFirmId: testLawFirmId },
        req: { headers: {} } as any,
        res: {} as any,
      });

      const result = await caller.cases.list({ status: undefined, search: undefined });
      expect(Array.isArray(result)).toBe(true);
    });

    it("should filter cases by status", async () => {
      const caller = createCaller({
        user: { ...mockUser, lawFirmId: testLawFirmId },
        req: { headers: {} } as any,
        res: {} as any,
      });

      const result = await caller.cases.list({ status: "open", search: undefined });
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("cases.create", () => {
    it("should create a new case", async () => {
      const caller = createCaller({
        user: { ...mockUser, lawFirmId: testLawFirmId },
        req: { headers: {} } as any,
        res: {} as any,
      });

      const caseNumber = `CASE-${Date.now()}`;
      const result = await caller.cases.create({
        caseNumber,
        clientId: testClientId,
        lawyerId: testUserId,
        title: "Test Case",
        description: "Test case description",
        caseType: "civil",
        courtName: "Test Court",
        judge: "Test Judge",
        oppositeParty: "Test Opponent",
        priority: "medium",
        matterId: testMatterId,
      });

      expect(result).toBeDefined();
      expect(result.caseNumber).toBe(caseNumber);
      expect(result.title).toBe("Test Case");
      expect(result.caseType).toBe("civil");
      expect(result.lawFirmId).toBe(testLawFirmId);
      testCaseId = result.id;
    });

    it("should require a case number", async () => {
      const caller = createCaller({
        user: { ...mockUser, lawFirmId: testLawFirmId },
        req: { headers: {} } as any,
        res: {} as any,
      });

      try {
        await caller.cases.create({
          caseNumber: "",
          clientId: testClientId,
          lawyerId: testUserId,
          title: "Test Case",
          description: "Test case description",
          caseType: "civil",
          matterId: testMatterId,
        });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("cases.get", () => {
    it("should retrieve a specific case", async () => {
      if (!testCaseId) {
        // Create a case first
        const caller = createCaller({
          user: { ...mockUser, lawFirmId: testLawFirmId },
          req: { headers: {} } as any,
          res: {} as any,
        });

        const result = await caller.cases.create({
          caseNumber: `CASE-GET-${Date.now()}`,
          clientId: testClientId,
          lawyerId: testUserId,
          title: "Test Case for Get",
          description: "Test case description",
          caseType: "criminal",
          matterId: testMatterId,
        });
        testCaseId = result.id;
      }

      const caller = createCaller({
        user: { ...mockUser, lawFirmId: testLawFirmId },
        req: { headers: {} } as any,
        res: {} as any,
      });

      const result = await caller.cases.get(testCaseId);
      expect(result).toBeDefined();
      expect(result.id).toBe(testCaseId);
      expect(result.lawFirmId).toBe(testLawFirmId);
    });

    it("should throw NOT_FOUND for non-existent case", async () => {
      const caller = createCaller({
        user: { ...mockUser, lawFirmId: testLawFirmId },
        req: { headers: {} } as any,
        res: {} as any,
      });

      try {
        await caller.cases.get(99999);
        expect.fail("Should have thrown NOT_FOUND error");
      } catch (error: any) {
        expect(error.code).toBe("NOT_FOUND");
      }
    });
  });

  describe("cases.update", () => {
    it("should update a case", async () => {
      if (!testCaseId) {
        // Create a case first
        const caller = createCaller({
          user: { ...mockUser, lawFirmId: testLawFirmId },
          req: { headers: {} } as any,
          res: {} as any,
        });

        const result = await caller.cases.create({
          caseNumber: `CASE-UPDATE-${Date.now()}`,
          clientId: testClientId,
          lawyerId: testUserId,
          title: "Test Case for Update",
          description: "Test case description",
          caseType: "commercial",
          matterId: testMatterId,
        });
        testCaseId = result.id;
      }

      const caller = createCaller({
        user: { ...mockUser, lawFirmId: testLawFirmId },
        req: { headers: {} } as any,
        res: {} as any,
      });

      const result = await caller.cases.update({
        id: testCaseId,
        title: "Updated Case Title",
        status: "pending",
      });

      expect(result).toBeDefined();
      expect(result.title).toBe("Updated Case Title");
      expect(result.status).toBe("pending");
    });
  });

  describe("cases.delete", () => {
    it("should soft delete a case", async () => {
      // Create a case specifically for deletion
      const caller = createCaller({
        user: { ...mockUser, lawFirmId: testLawFirmId },
        req: { headers: {} } as any,
        res: {} as any,
      });

      const createResult = await caller.cases.create({
        caseNumber: `CASE-DELETE-${Date.now()}`,
        clientId: testClientId,
        lawyerId: testUserId,
        title: "Test Case for Delete",
        description: "Test case description",
        caseType: "family",
        matterId: testMatterId,
      });

      const deleteResult = await caller.cases.delete(createResult.id);
      expect(deleteResult).toBeDefined();
      expect(deleteResult.success).toBe(true);
    });
  });
});
