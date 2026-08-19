import {
  claimCourtSessionReminder,
  createNotification,
  getCaseById,
  getUpcomingSessions,
  getUsersByLawFirm,
} from "./db";

export type DeadlineJobResult = {
  inspected: number;
  claimed: number;
  notificationsCreated: number;
  skippedAsClaimed: number;
};

/**
 * Deterministic job entrypoint. A production scheduler should invoke this
 * function per firm; it never depends on a browser remaining open.
 */
export async function runCourtSessionReminderJob(
  lawFirmId: number,
  warningHours = 24,
): Promise<DeadlineJobResult> {
  const sessions = await getUpcomingSessions(lawFirmId, warningHours);
  const users = await getUsersByLawFirm(lawFirmId);
  const result: DeadlineJobResult = {
    inspected: sessions.length,
    claimed: 0,
    notificationsCreated: 0,
    skippedAsClaimed: 0,
  };

  for (const session of sessions) {
    const claimed = await claimCourtSessionReminder(session.id, lawFirmId);
    if (!claimed) {
      result.skippedAsClaimed += 1;
      continue;
    }
    result.claimed += 1;
    const caseData = await getCaseById(session.caseId);
    if (!caseData || caseData.lawFirmId !== lawFirmId) continue;

    for (const user of users) {
      await createNotification({
        userId: user.id,
        matterId: caseData.matterId,
        caseId: caseData.id,
        projectId: null,
        title: "تذكير بجلسة قضائية",
        message: `تقترب جلسة القضية ${caseData.title} بتاريخ ${session.sessionDate.toISOString()}.`,
        type: "session_reminder",
        isRead: false,
        readAt: null,
      });
      result.notificationsCreated += 1;
    }
  }
  return result;
}
