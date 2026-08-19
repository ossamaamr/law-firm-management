import { eq, and, desc, asc, like, sql, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  lawFirms, brandingSettings, userInvitations, registrationRequests, clients, matters, cases, projects, courtSessions, 
  tasks, documents, timesheets, expenses, duePayments, invoices,
  notifications, auditLogs, legalServiceRequests,
  type User, type LawFirm, type Client, type Matter, type Case, type Project, 
  type CourtSession, type Task, type Document, type Timesheet, type Expense,
  type DuePayment, type Invoice, type Notification, type AuditLog, type LegalServiceRequest,
  type BrandingSettings, type UserInvitation, type RegistrationRequest
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

function getInsertId(result: unknown): number {
  const header = Array.isArray(result) ? result[0] : result;
  const insertId = (header as { insertId?: unknown } | null | undefined)?.insertId;
  const id = Number(insertId);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error("Insert did not return a valid insertId");
  }
  return id;
}

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ USER QUERIES ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUsersByLawFirm(lawFirmId: number): Promise<User[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(users).where(eq(users.lawFirmId, lawFirmId));
}

export async function updateUserRoleInLawFirm(
  userId: number,
  lawFirmId: number,
  role: User["role"],
): Promise<User | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(users)
    .set({ role })
    .where(and(eq(users.id, userId), eq(users.lawFirmId, lawFirmId)));
  return getUserById(userId);
}

export async function assignUserToLawFirm(
  userId: number,
  lawFirmId: number,
  role: User["role"],
): Promise<User | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(users)
    .set({ lawFirmId, role })
    .where(and(eq(users.id, userId), isNull(users.lawFirmId)));
  return getUserById(userId);
}

// ============ USER INVITATION QUERIES ============

export async function getInvitationsByLawFirm(lawFirmId: number): Promise<UserInvitation[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(userInvitations)
    .where(eq(userInvitations.lawFirmId, lawFirmId))
    .orderBy(desc(userInvitations.createdAt))
    .limit(100);
}

export async function getInvitationByTokenHash(tokenHash: string): Promise<UserInvitation | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(userInvitations)
    .where(eq(userInvitations.tokenHash, tokenHash))
    .limit(1);
  return result[0];
}

export async function createUserInvitation(
  data: Omit<UserInvitation, "id" | "createdAt" | "updatedAt" | "acceptedById" | "acceptedAt" | "revokedAt">,
): Promise<UserInvitation> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(userInvitations).values(data as any);
  const id = getInsertId(result);
  const invitation = await db.select().from(userInvitations).where(eq(userInvitations.id, id)).limit(1);
  if (!invitation[0]) throw new Error("Failed to create invitation");
  return invitation[0];
}

export async function revokeUserInvitation(lawFirmId: number, invitationId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(userInvitations)
    .set({ status: "revoked", revokedAt: new Date() })
    .where(and(eq(userInvitations.id, invitationId), eq(userInvitations.lawFirmId, lawFirmId), eq(userInvitations.status, "pending")));
}

export async function markInvitationAccepted(invitationId: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(userInvitations)
    .set({ status: "accepted", acceptedById: userId, acceptedAt: new Date() })
    .where(and(eq(userInvitations.id, invitationId), eq(userInvitations.status, "pending")));
}

// ============ LAW FIRM QUERIES ============

export async function getLawFirmByIdentifier(identifier: string): Promise<LawFirm | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(lawFirms).where(eq(lawFirms.identifier, identifier)).limit(1);
  return result[0];
}

export async function getLawFirmById(id: number): Promise<LawFirm | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(lawFirms).where(eq(lawFirms.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ REGISTRATION REQUEST QUERIES ============

export async function getRegistrationRequestsByLawFirm(lawFirmId: number): Promise<RegistrationRequest[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(registrationRequests).where(eq(registrationRequests.lawFirmId, lawFirmId)).orderBy(desc(registrationRequests.createdAt)).limit(100);
}

export async function getRegistrationRequestsByUser(userId: number): Promise<RegistrationRequest[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(registrationRequests).where(eq(registrationRequests.requesterUserId, userId)).orderBy(desc(registrationRequests.createdAt)).limit(20);
}

export async function createRegistrationRequest(
  data: Omit<RegistrationRequest, "id" | "createdAt" | "updatedAt" | "reviewedById" | "reviewedAt" | "rejectionReason">,
): Promise<RegistrationRequest> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(registrationRequests).values(data as any);
  const id = getInsertId(result);
  const rows = await db.select().from(registrationRequests).where(eq(registrationRequests.id, id)).limit(1);
  if (!rows[0]) throw new Error("Failed to create registration request");
  return rows[0];
}

export async function reviewRegistrationRequest(
  lawFirmId: number,
  requestId: number,
  status: RegistrationRequest["status"],
  reviewedById: number,
  rejectionReason?: string,
): Promise<RegistrationRequest | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(registrationRequests).set({ status, reviewedById, reviewedAt: new Date(), rejectionReason: rejectionReason ?? null }).where(and(eq(registrationRequests.id, requestId), eq(registrationRequests.lawFirmId, lawFirmId), eq(registrationRequests.status, "pending")));
  const rows = await db.select().from(registrationRequests).where(and(eq(registrationRequests.id, requestId), eq(registrationRequests.lawFirmId, lawFirmId))).limit(1);
  return rows[0];
}

export async function createLawFirm(data: Omit<LawFirm, 'id' | 'createdAt' | 'updatedAt'>): Promise<LawFirm> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(lawFirms).values(data as any);
  const id = getInsertId(result);
  const firm = await getLawFirmById(id);
  if (!firm) throw new Error("Failed to create law firm");
  return firm;
}

// ============ BRANDING QUERIES ============

export async function getBrandingSettings(lawFirmId: number): Promise<BrandingSettings | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(brandingSettings)
    .where(eq(brandingSettings.lawFirmId, lawFirmId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertBrandingSettings(
  lawFirmId: number,
  data: Pick<BrandingSettings, "platformNameAr" | "platformNameEn" | "logoUrl"> & { updatedById: number },
): Promise<BrandingSettings> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .insert(brandingSettings)
    .values({ lawFirmId, ...data })
    .onDuplicateKeyUpdate({
      set: {
        platformNameAr: data.platformNameAr,
        platformNameEn: data.platformNameEn,
        logoUrl: data.logoUrl,
        updatedById: data.updatedById,
      },
    });

  const saved = await getBrandingSettings(lawFirmId);
  if (!saved) throw new Error("Failed to save branding settings");
  return saved;
}

// ============ CLIENT QUERIES ============

export async function getClientsByLawFirm(lawFirmId: number): Promise<Client[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(clients).where(eq(clients.lawFirmId, lawFirmId));
}

export async function getClientById(id: number): Promise<Client | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createClient(data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(clients).values(data as any);
  const id = getInsertId(result);
  const client = await getClientById(id);
  if (!client) throw new Error("Failed to create client");
  return client;
}

export async function updateClientInLawFirm(
  id: number,
  lawFirmId: number,
  data: Partial<Omit<Client, "id" | "lawFirmId" | "createdAt" | "updatedAt">>,
): Promise<Client | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(clients)
    .set(data as any)
    .where(and(eq(clients.id, id), eq(clients.lawFirmId, lawFirmId)));
  const result = await db.select().from(clients)
    .where(and(eq(clients.id, id), eq(clients.lawFirmId, lawFirmId)))
    .limit(1);
  return result[0];
}

// ============ MATTER QUERIES ============

export async function getMattersByLawFirm(lawFirmId: number): Promise<Matter[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(matters).where(eq(matters.lawFirmId, lawFirmId)).orderBy(desc(matters.createdAt));
}

export async function getMatterById(id: number): Promise<Matter | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(matters).where(eq(matters.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createMatter(data: Omit<Matter, 'id' | 'createdAt' | 'updatedAt'>): Promise<Matter> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(matters).values(data as any);
  const id = getInsertId(result);
  const matter = await getMatterById(id);
  if (!matter) throw new Error("Failed to create matter");
  return matter;
}

// ============ CASE QUERIES ============

export async function getCasesByMatter(matterId: number): Promise<Case[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(cases).where(and(
    eq(cases.matterId, matterId),
    eq(cases.isDeleted, false)
  )).orderBy(desc(cases.createdAt));
}

export async function getCasesByLawFirm(lawFirmId: number, filters?: { status?: string; search?: string }): Promise<Case[]> {
  const db = await getDb();
  if (!db) return [];

  let conditions = [eq(cases.lawFirmId, lawFirmId), eq(cases.isDeleted, false)];

  if (filters?.status) {
    conditions.push(eq(cases.status, filters.status as any));
  }

  if (filters?.search) {
    conditions.push(sql`(${cases.caseNumber} LIKE ${`%${filters.search}%`} OR ${cases.title} LIKE ${`%${filters.search}%`})`);
  }

  return db.select().from(cases).where(and(...conditions)).orderBy(desc(cases.createdAt));
}

export async function getCaseById(id: number): Promise<Case | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(cases).where(eq(cases.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createCase(data: Omit<Case, 'id' | 'createdAt' | 'updatedAt'>): Promise<Case> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(cases).values(data as any);
  const id = getInsertId(result);
  const caseData = await getCaseById(id);
  if (!caseData) throw new Error("Failed to create case");
  return caseData;
}

export async function updateCase(id: number, data: Partial<Omit<Case, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Case | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  await db.update(cases).set(data as any).where(eq(cases.id, id));
  return getCaseById(id);
}

export async function softDeleteCase(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(cases).set({ isDeleted: true }).where(eq(cases.id, id));
}

// ============ PROJECT QUERIES ============

export async function getProjectsByMatter(matterId: number): Promise<Project[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(projects).where(and(
    eq(projects.matterId, matterId),
    eq(projects.isDeleted, false)
  )).orderBy(desc(projects.createdAt));
}

export async function getProjectById(id: number): Promise<Project | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createProject(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(projects).values(data as any);
  const id = getInsertId(result);
  const project = await getProjectById(id);
  if (!project) throw new Error("Failed to create project");
  return project;
}

// ============ COURT SESSION QUERIES ============

export async function getSessionsByCaseId(caseId: number): Promise<CourtSession[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(courtSessions).where(eq(courtSessions.caseId, caseId)).orderBy(desc(courtSessions.sessionDate));
}

export async function getUpcomingSessions(lawFirmId: number, hoursAhead: number = 24): Promise<CourtSession[]> {
  const db = await getDb();
  if (!db) return [];

  const futureTime = new Date(Date.now() + hoursAhead * 60 * 60 * 1000);
  const now = new Date();

  return db.select().from(courtSessions)
    .where(and(
      sql`${courtSessions.sessionDate} BETWEEN ${now} AND ${futureTime}`,
      eq(courtSessions.notificationSent, false)
    ))
    .orderBy(asc(courtSessions.sessionDate));
}

export async function createCourtSession(data: Omit<CourtSession, 'id' | 'createdAt' | 'updatedAt'>): Promise<CourtSession> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(courtSessions).values(data as any);
  const id = getInsertId(result);
  const session = await db.select().from(courtSessions).where(eq(courtSessions.id, id)).limit(1);
  if (!session.length) throw new Error("Failed to create court session");
  return session[0];
}

// ============ DOCUMENT QUERIES ============

export async function getDocumentsByCaseId(caseId: number, lawFirmId: number): Promise<Document[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(documents)
    .where(and(eq(documents.caseId, caseId), eq(documents.lawFirmId, lawFirmId)))
    .orderBy(desc(documents.createdAt));
}

export async function getDocumentById(id: number, lawFirmId: number): Promise<Document | null> {
  const db = await getDb();
  if (!db) return null;

  const rows = await db.select().from(documents)
    .where(and(eq(documents.id, id), eq(documents.lawFirmId, lawFirmId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function createDocument(data: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>): Promise<Document> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(documents).values(data as any);
  const id = getInsertId(result);
  const doc = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
  if (!doc.length) throw new Error("Failed to create document");
  return doc[0];
}

export async function deleteDocument(id: number, lawFirmId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(documents).where(and(eq(documents.id, id), eq(documents.lawFirmId, lawFirmId)));
}

// ============ NOTIFICATION QUERIES ============

export async function getUserNotifications(userId: number, limit: number = 50): Promise<Notification[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function createNotification(data: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(notifications).values(data as any);
  const id = getInsertId(result);
  const notif = await db.select().from(notifications).where(eq(notifications.id, id)).limit(1);
  if (!notif.length) throw new Error("Failed to create notification");
  return notif[0];
}

export async function markNotificationAsRead(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
}

// ============ AUDIT LOG QUERIES ============

export async function createAuditLog(data: Omit<AuditLog, 'id' | 'createdAt'>): Promise<AuditLog> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(auditLogs).values(data as any);
  const id = getInsertId(result);
  const log = await db.select().from(auditLogs).where(eq(auditLogs.id, id)).limit(1);
  if (!log.length) throw new Error("Failed to create audit log");
  return log[0];
}

export async function getAuditLogsByCaseId(caseId: number, limit: number = 100): Promise<AuditLog[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(auditLogs)
    .where(eq(auditLogs.caseId, caseId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}

// ============ TIMESHEET QUERIES ============

export async function getTimesheetsByMatter(matterId: number): Promise<Timesheet[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(timesheets)
    .where(eq(timesheets.matterId, matterId))
    .orderBy(desc(timesheets.date));
}

export async function createTimesheet(data: Omit<Timesheet, 'id' | 'createdAt' | 'updatedAt'>): Promise<Timesheet> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(timesheets).values(data as any);
  const id = getInsertId(result);
  const sheet = await db.select().from(timesheets).where(eq(timesheets.id, id)).limit(1);
  if (!sheet.length) throw new Error("Failed to create timesheet");
  return sheet[0];
}

// ============ EXPENSE QUERIES ============

export async function getExpensesByMatter(matterId: number): Promise<Expense[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(expenses)
    .where(eq(expenses.matterId, matterId))
    .orderBy(desc(expenses.date));
}

export async function createExpense(data: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>): Promise<Expense> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(expenses).values(data as any);
  const id = getInsertId(result);
  const expense = await db.select().from(expenses).where(eq(expenses.id, id)).limit(1);
  if (!expense.length) throw new Error("Failed to create expense");
  return expense[0];
}

// ============ INVOICE QUERIES ============

export async function getInvoicesByMatter(matterId: number): Promise<Invoice[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(invoices)
    .where(eq(invoices.matterId, matterId))
    .orderBy(desc(invoices.invoiceDate));
}

export async function createInvoice(data: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<Invoice> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(invoices).values(data as any);
  const id = getInsertId(result);
  const invoice = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
  if (!invoice.length) throw new Error("Failed to create invoice");
  return invoice[0];
}
