import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUpcomingSessions: vi.fn(),
  getUsersByLawFirm: vi.fn(),
  claimCourtSessionReminder: vi.fn(),
  getCaseById: vi.fn(),
  createNotification: vi.fn(),
}));

vi.mock("./db", () => mocks);

import { runCourtSessionReminderJob } from "./deadline.service";

describe("deadline reminder job", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUsersByLawFirm.mockResolvedValue([{ id: 7 }, { id: 8 }]);
    mocks.getCaseById.mockResolvedValue({ id: 10, lawFirmId: 101, matterId: 20, title: "نزاع تجاري" });
    mocks.createNotification.mockResolvedValue({ id: 1 });
  });

  it("claims once and creates one notification per tenant user", async () => {
    mocks.getUpcomingSessions.mockResolvedValue([{ id: 55, caseId: 10, sessionDate: new Date("2026-09-01T10:00:00Z") }]);
    mocks.claimCourtSessionReminder.mockResolvedValue(true);

    await expect(runCourtSessionReminderJob(101, 48)).resolves.toEqual({
      inspected: 1,
      claimed: 1,
      notificationsCreated: 2,
      skippedAsClaimed: 0,
    });
    expect(mocks.claimCourtSessionReminder).toHaveBeenCalledWith(55, 101);
    expect(mocks.createNotification).toHaveBeenCalledTimes(2);
  });

  it("does not duplicate notifications when another worker already claimed the session", async () => {
    mocks.getUpcomingSessions.mockResolvedValue([{ id: 55, caseId: 10, sessionDate: new Date("2026-09-01T10:00:00Z") }]);
    mocks.claimCourtSessionReminder.mockResolvedValue(false);

    await expect(runCourtSessionReminderJob(101)).resolves.toEqual({
      inspected: 1,
      claimed: 0,
      notificationsCreated: 0,
      skippedAsClaimed: 1,
    });
    expect(mocks.createNotification).not.toHaveBeenCalled();
  });
});
