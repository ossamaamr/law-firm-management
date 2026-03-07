// server/_core/index.ts
import "dotenv/config";
import express2 from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/db.ts
import { eq, and, desc, asc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";

// drizzle/schema.ts
import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
var users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["admin", "manager", "lawyer", "accountant", "user"]).default("user").notNull(),
  lawFirmId: int("lawFirmId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
});
var lawFirms = mysqlTable("lawFirms", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 100 }),
  licenseNumber: varchar("licenseNumber", { length: 100 }).unique(),
  managerId: int("managerId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  lawFirmId: int("lawFirmId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  nationalId: varchar("nationalId", { length: 50 }),
  clientType: mysqlEnum("clientType", ["individual", "company"]).default("individual").notNull(),
  kycStatus: mysqlEnum("kycStatus", ["pending", "approved", "rejected"]).default("pending").notNull(),
  conflictCheckStatus: mysqlEnum("conflictCheckStatus", ["pending", "clear", "conflict"]).default("pending").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var legalServiceRequests = mysqlTable("legalServiceRequests", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  lawFirmId: int("lawFirmId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  serviceType: mysqlEnum("serviceType", ["litigation", "corporate", "advisory", "other"]).notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "converted"]).default("pending").notNull(),
  requestedDate: timestamp("requestedDate").defaultNow().notNull(),
  convertedToMatterId: int("convertedToMatterId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var matters = mysqlTable("matters", {
  id: int("id").autoincrement().primaryKey(),
  lawFirmId: int("lawFirmId").notNull(),
  clientId: int("clientId").notNull(),
  matterNumber: varchar("matterNumber", { length: 100 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  matterType: mysqlEnum("matterType", ["litigation", "corporate", "advisory", "other"]).notNull(),
  status: mysqlEnum("status", ["open", "pending", "closed", "archived"]).default("open").notNull(),
  leadLawyerId: int("leadLawyerId").notNull(),
  openDate: timestamp("openDate").defaultNow().notNull(),
  closeDate: timestamp("closeDate"),
  // Fee Agreement
  feeAgreementType: mysqlEnum("feeAgreementType", ["fixed", "hourly", "contingency", "retainer"]).notNull(),
  feeAmount: decimal("feeAmount", { precision: 12, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var cases = mysqlTable("cases", {
  id: int("id").autoincrement().primaryKey(),
  matterId: int("matterId").notNull(),
  lawFirmId: int("lawFirmId").notNull(),
  caseNumber: varchar("caseNumber", { length: 100 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  caseType: mysqlEnum("caseType", ["civil", "criminal", "commercial", "family", "administrative", "labor", "other"]).notNull(),
  status: mysqlEnum("status", ["open", "pending", "closed", "archived", "suspended"]).default("open").notNull(),
  courtName: varchar("courtName", { length: 255 }),
  judge: varchar("judge", { length: 255 }),
  oppositeParty: varchar("oppositeParty", { length: 255 }),
  partyRole: mysqlEnum("partyRole", ["plaintiff", "defendant", "appellant", "respondent"]),
  filingDate: timestamp("filingDate"),
  nextSessionDate: timestamp("nextSessionDate"),
  estimatedClosureDate: timestamp("estimatedClosureDate"),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  budget: decimal("budget", { precision: 12, scale: 2 }),
  expenditure: decimal("expenditure", { precision: 12, scale: 2 }).default("0"),
  notes: text("notes"),
  isDeleted: boolean("isDeleted").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  matterId: int("matterId").notNull(),
  lawFirmId: int("lawFirmId").notNull(),
  projectNumber: varchar("projectNumber", { length: 100 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  projectType: mysqlEnum("projectType", ["contract", "compliance", "merger", "incorporation", "other"]).notNull(),
  status: mysqlEnum("status", ["planning", "in_progress", "review", "completed", "archived"]).default("planning").notNull(),
  leadLawyerId: int("leadLawyerId").notNull(),
  startDate: timestamp("startDate"),
  targetCompletionDate: timestamp("targetCompletionDate"),
  actualCompletionDate: timestamp("actualCompletionDate"),
  budget: decimal("budget", { precision: 12, scale: 2 }),
  expenditure: decimal("expenditure", { precision: 12, scale: 2 }).default("0"),
  notes: text("notes"),
  isDeleted: boolean("isDeleted").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var courtSessions = mysqlTable("courtSessions", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").notNull(),
  sessionDate: timestamp("sessionDate").notNull(),
  sessionTime: varchar("sessionTime", { length: 10 }),
  courtRoom: varchar("courtRoom", { length: 100 }),
  description: text("description"),
  outcome: text("outcome"),
  nextSessionDate: timestamp("nextSessionDate"),
  notificationSent: boolean("notificationSent").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  matterId: int("matterId"),
  caseId: int("caseId"),
  projectId: int("projectId"),
  lawFirmId: int("lawFirmId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  assignedToId: int("assignedToId").notNull(),
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "cancelled"]).default("pending").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  dueDate: timestamp("dueDate"),
  completedDate: timestamp("completedDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  matterId: int("matterId"),
  caseId: int("caseId"),
  projectId: int("projectId"),
  lawFirmId: int("lawFirmId").notNull(),
  uploadedById: int("uploadedById").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileType: varchar("fileType", { length: 50 }),
  fileSize: int("fileSize"),
  s3Key: varchar("s3Key", { length: 500 }).notNull(),
  s3Url: text("s3Url").notNull(),
  documentType: mysqlEnum("documentType", ["power_of_attorney", "contract", "evidence", "court_order", "judgment", "petition", "response", "invoice", "receipt", "other"]).notNull(),
  description: text("description"),
  isPublic: boolean("isPublic").default(false),
  expiryDate: timestamp("expiryDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var timesheets = mysqlTable("timesheets", {
  id: int("id").autoincrement().primaryKey(),
  matterId: int("matterId").notNull(),
  lawyerId: int("lawyerId").notNull(),
  lawFirmId: int("lawFirmId").notNull(),
  date: timestamp("date").notNull(),
  hours: decimal("hours", { precision: 5, scale: 2 }).notNull(),
  description: text("description"),
  hourlyRate: decimal("hourlyRate", { precision: 10, scale: 2 }),
  status: mysqlEnum("status", ["draft", "submitted", "approved", "rejected"]).default("draft").notNull(),
  approvedById: int("approvedById"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var expenses = mysqlTable("expenses", {
  id: int("id").autoincrement().primaryKey(),
  matterId: int("matterId").notNull(),
  submittedById: int("submittedById").notNull(),
  lawFirmId: int("lawFirmId").notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  category: mysqlEnum("category", ["travel", "filing_fees", "expert_fees", "court_costs", "other"]).notNull(),
  date: timestamp("date").notNull(),
  status: mysqlEnum("status", ["draft", "submitted", "approved", "rejected"]).default("draft").notNull(),
  approvedById: int("approvedById"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var duePayments = mysqlTable("duePayments", {
  id: int("id").autoincrement().primaryKey(),
  matterId: int("matterId").notNull(),
  lawFirmId: int("lawFirmId").notNull(),
  timesheetIds: json("timesheetIds"),
  expenseIds: json("expenseIds"),
  totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "approved", "invoiced", "paid"]).default("pending").notNull(),
  approvedById: int("approvedById"),
  invoicedDate: timestamp("invoicedDate"),
  paidDate: timestamp("paidDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  matterId: int("matterId").notNull(),
  clientId: int("clientId").notNull(),
  lawFirmId: int("lawFirmId").notNull(),
  invoiceNumber: varchar("invoiceNumber", { length: 100 }).notNull().unique(),
  duePaymentId: int("duePaymentId"),
  totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }).notNull(),
  taxAmount: decimal("taxAmount", { precision: 12, scale: 2 }).default("0"),
  finalAmount: decimal("finalAmount", { precision: 12, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["draft", "sent", "paid", "overdue", "cancelled"]).default("draft").notNull(),
  invoiceDate: timestamp("invoiceDate").defaultNow().notNull(),
  dueDate: timestamp("dueDate"),
  paidDate: timestamp("paidDate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  matterId: int("matterId"),
  caseId: int("caseId"),
  projectId: int("projectId"),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: mysqlEnum("type", ["session_reminder", "case_update", "new_matter", "task_assigned", "payment_due", "document_upload", "system"]).notNull(),
  isRead: boolean("isRead").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  readAt: timestamp("readAt")
});
var auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  lawFirmId: int("lawFirmId").notNull(),
  matterId: int("matterId"),
  caseId: int("caseId"),
  projectId: int("projectId"),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entityType", { length: 50 }).notNull(),
  entityId: int("entityId"),
  changes: json("changes"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var usersRelations = relations(users, ({ one, many }) => ({
  lawFirm: one(lawFirms, {
    fields: [users.lawFirmId],
    references: [lawFirms.id]
  }),
  matters: many(matters),
  cases: many(cases),
  projects: many(projects),
  documents: many(documents),
  timesheets: many(timesheets),
  expenses: many(expenses),
  tasks: many(tasks),
  notifications: many(notifications),
  auditLogs: many(auditLogs)
}));
var lawFirmsRelations = relations(lawFirms, ({ one, many }) => ({
  manager: one(users, {
    fields: [lawFirms.managerId],
    references: [users.id]
  }),
  users: many(users),
  clients: many(clients),
  matters: many(matters),
  cases: many(cases),
  projects: many(projects),
  legalServiceRequests: many(legalServiceRequests),
  tasks: many(tasks),
  documents: many(documents),
  timesheets: many(timesheets),
  expenses: many(expenses),
  duePayments: many(duePayments),
  invoices: many(invoices),
  auditLogs: many(auditLogs)
}));
var clientsRelations = relations(clients, ({ one, many }) => ({
  lawFirm: one(lawFirms, {
    fields: [clients.lawFirmId],
    references: [lawFirms.id]
  }),
  matters: many(matters),
  legalServiceRequests: many(legalServiceRequests),
  invoices: many(invoices)
}));
var legalServiceRequestsRelations = relations(legalServiceRequests, ({ one, many }) => ({
  client: one(clients, {
    fields: [legalServiceRequests.clientId],
    references: [clients.id]
  }),
  lawFirm: one(lawFirms, {
    fields: [legalServiceRequests.lawFirmId],
    references: [lawFirms.id]
  })
}));
var mattersRelations = relations(matters, ({ one, many }) => ({
  lawFirm: one(lawFirms, {
    fields: [matters.lawFirmId],
    references: [lawFirms.id]
  }),
  client: one(clients, {
    fields: [matters.clientId],
    references: [clients.id]
  }),
  leadLawyer: one(users, {
    fields: [matters.leadLawyerId],
    references: [users.id]
  }),
  cases: many(cases),
  projects: many(projects),
  tasks: many(tasks),
  documents: many(documents),
  timesheets: many(timesheets),
  expenses: many(expenses),
  duePayments: many(duePayments),
  invoices: many(invoices),
  auditLogs: many(auditLogs)
}));
var casesRelations = relations(cases, ({ one, many }) => ({
  matter: one(matters, {
    fields: [cases.matterId],
    references: [matters.id]
  }),
  lawFirm: one(lawFirms, {
    fields: [cases.lawFirmId],
    references: [lawFirms.id]
  }),
  sessions: many(courtSessions),
  tasks: many(tasks),
  documents: many(documents),
  notifications: many(notifications),
  auditLogs: many(auditLogs)
}));
var projectsRelations = relations(projects, ({ one, many }) => ({
  matter: one(matters, {
    fields: [projects.matterId],
    references: [matters.id]
  }),
  lawFirm: one(lawFirms, {
    fields: [projects.lawFirmId],
    references: [lawFirms.id]
  }),
  leadLawyer: one(users, {
    fields: [projects.leadLawyerId],
    references: [users.id]
  }),
  tasks: many(tasks),
  documents: many(documents),
  notifications: many(notifications),
  auditLogs: many(auditLogs)
}));
var courtSessionsRelations = relations(courtSessions, ({ one }) => ({
  case: one(cases, {
    fields: [courtSessions.caseId],
    references: [cases.id]
  })
}));
var tasksRelations = relations(tasks, ({ one }) => ({
  matter: one(matters, {
    fields: [tasks.matterId],
    references: [matters.id]
  }),
  case: one(cases, {
    fields: [tasks.caseId],
    references: [cases.id]
  }),
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id]
  }),
  lawFirm: one(lawFirms, {
    fields: [tasks.lawFirmId],
    references: [lawFirms.id]
  }),
  assignedTo: one(users, {
    fields: [tasks.assignedToId],
    references: [users.id]
  })
}));
var documentsRelations = relations(documents, ({ one }) => ({
  matter: one(matters, {
    fields: [documents.matterId],
    references: [matters.id]
  }),
  case: one(cases, {
    fields: [documents.caseId],
    references: [cases.id]
  }),
  project: one(projects, {
    fields: [documents.projectId],
    references: [projects.id]
  }),
  lawFirm: one(lawFirms, {
    fields: [documents.lawFirmId],
    references: [lawFirms.id]
  }),
  uploadedBy: one(users, {
    fields: [documents.uploadedById],
    references: [users.id]
  })
}));
var timesheetsRelations = relations(timesheets, ({ one }) => ({
  matter: one(matters, {
    fields: [timesheets.matterId],
    references: [matters.id]
  }),
  lawyer: one(users, {
    fields: [timesheets.lawyerId],
    references: [users.id]
  }),
  lawFirm: one(lawFirms, {
    fields: [timesheets.lawFirmId],
    references: [lawFirms.id]
  }),
  approvedBy: one(users, {
    fields: [timesheets.approvedById],
    references: [users.id]
  })
}));
var expensesRelations = relations(expenses, ({ one }) => ({
  matter: one(matters, {
    fields: [expenses.matterId],
    references: [matters.id]
  }),
  submittedBy: one(users, {
    fields: [expenses.submittedById],
    references: [users.id]
  }),
  lawFirm: one(lawFirms, {
    fields: [expenses.lawFirmId],
    references: [lawFirms.id]
  }),
  approvedBy: one(users, {
    fields: [expenses.approvedById],
    references: [users.id]
  })
}));
var duePaymentsRelations = relations(duePayments, ({ one }) => ({
  matter: one(matters, {
    fields: [duePayments.matterId],
    references: [matters.id]
  }),
  lawFirm: one(lawFirms, {
    fields: [duePayments.lawFirmId],
    references: [lawFirms.id]
  }),
  approvedBy: one(users, {
    fields: [duePayments.approvedById],
    references: [users.id]
  })
}));
var invoicesRelations = relations(invoices, ({ one }) => ({
  matter: one(matters, {
    fields: [invoices.matterId],
    references: [matters.id]
  }),
  client: one(clients, {
    fields: [invoices.clientId],
    references: [clients.id]
  }),
  lawFirm: one(lawFirms, {
    fields: [invoices.lawFirmId],
    references: [lawFirms.id]
  }),
  duePayment: one(duePayments, {
    fields: [invoices.duePaymentId],
    references: [duePayments.id]
  })
}));
var notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id]
  }),
  matter: one(matters, {
    fields: [notifications.matterId],
    references: [matters.id]
  }),
  case: one(cases, {
    fields: [notifications.caseId],
    references: [cases.id]
  }),
  project: one(projects, {
    fields: [notifications.projectId],
    references: [projects.id]
  })
}));
var auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id]
  }),
  lawFirm: one(lawFirms, {
    fields: [auditLogs.lawFirmId],
    references: [lawFirms.id]
  }),
  matter: one(matters, {
    fields: [auditLogs.matterId],
    references: [matters.id]
  }),
  case: one(cases, {
    fields: [auditLogs.caseId],
    references: [cases.id]
  }),
  project: one(projects, {
    fields: [auditLogs.projectId],
    references: [projects.id]
  })
}));

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// server/db.ts
var _db = null;
async function getDb() {
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
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = {
      openId: user.openId
    };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = /* @__PURE__ */ new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    }
    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getClientsByLawFirm(lawFirmId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clients).where(eq(clients.lawFirmId, lawFirmId));
}
async function getClientById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function createClient(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(clients).values(data);
  const id = result.insertId;
  const client = await getClientById(id);
  if (!client) throw new Error("Failed to create client");
  return client;
}
async function getCasesByLawFirm(lawFirmId, filters) {
  const db = await getDb();
  if (!db) return [];
  let conditions = [eq(cases.lawFirmId, lawFirmId), eq(cases.isDeleted, false)];
  if (filters?.status) {
    conditions.push(eq(cases.status, filters.status));
  }
  if (filters?.search) {
    conditions.push(sql`(${cases.caseNumber} LIKE ${`%${filters.search}%`} OR ${cases.title} LIKE ${`%${filters.search}%`})`);
  }
  return db.select().from(cases).where(and(...conditions)).orderBy(desc(cases.createdAt));
}
async function getCaseById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(cases).where(eq(cases.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function createCase(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(cases).values(data);
  const id = result.insertId;
  const caseData = await getCaseById(id);
  if (!caseData) throw new Error("Failed to create case");
  return caseData;
}
async function updateCase(id, data) {
  const db = await getDb();
  if (!db) return void 0;
  await db.update(cases).set(data).where(eq(cases.id, id));
  return getCaseById(id);
}
async function softDeleteCase(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(cases).set({ isDeleted: true }).where(eq(cases.id, id));
}
async function getDocumentsByCaseId(caseId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(documents).where(eq(documents.caseId, caseId)).orderBy(desc(documents.createdAt));
}
async function getUserNotifications(userId, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(limit);
}
async function markNotificationAsRead(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(notifications).set({ isRead: true, readAt: /* @__PURE__ */ new Date() }).where(eq(notifications.id, id));
}
async function createAuditLog(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(auditLogs).values(data);
  const id = result.insertId;
  const log = await db.select().from(auditLogs).where(eq(auditLogs.id, id)).limit(1);
  if (!log.length) throw new Error("Failed to create audit log");
  return log[0];
}
async function getAuditLogsByCaseId(caseId, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(auditLogs).where(eq(auditLogs.caseId, caseId)).orderBy(desc(auditLogs.createdAt)).limit(limit);
}

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app) {
  app.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers.ts
import { z as z2 } from "zod";
import { TRPCError as TRPCError3 } from "@trpc/server";
var lawFirmProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!ctx.user.lawFirmId) {
    throw new TRPCError3({ code: "FORBIDDEN", message: "User not assigned to a law firm" });
  }
  return next({ ctx: { ...ctx, lawFirmId: ctx.user.lawFirmId } });
});
var adminProcedure2 = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== "admin" && ctx.user.role !== "manager") {
    throw new TRPCError3({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    })
  }),
  // ============ CASES ROUTER ============
  cases: router({
    list: lawFirmProcedure.input(z2.object({
      status: z2.string().optional(),
      search: z2.string().optional()
    })).query(async ({ input, ctx }) => {
      return getCasesByLawFirm(ctx.lawFirmId, {
        status: input.status,
        search: input.search
      });
    }),
    get: lawFirmProcedure.input(z2.number()).query(async ({ input, ctx }) => {
      const caseData = await getCaseById(input);
      if (!caseData || caseData.lawFirmId !== ctx.lawFirmId) {
        throw new TRPCError3({ code: "NOT_FOUND" });
      }
      return caseData;
    }),
    create: lawFirmProcedure.input(z2.object({
      caseNumber: z2.string(),
      clientId: z2.number(),
      lawyerId: z2.number(),
      title: z2.string(),
      description: z2.string().optional(),
      caseType: z2.enum(["civil", "criminal", "commercial", "family", "administrative", "labor", "other"]),
      courtName: z2.string().optional(),
      judge: z2.string().optional(),
      oppositeParty: z2.string().optional(),
      filingDate: z2.date().optional(),
      nextSessionDate: z2.date().optional(),
      priority: z2.enum(["low", "medium", "high", "urgent"]).optional(),
      budget: z2.string().optional(),
      matterId: z2.number()
    })).mutation(async ({ input, ctx }) => {
      const newCase = await createCase({
        matterId: input.matterId,
        lawFirmId: ctx.lawFirmId,
        caseNumber: input.caseNumber,
        title: input.title,
        description: input.description || null,
        caseType: input.caseType,
        courtName: input.courtName || null,
        judge: input.judge || null,
        oppositeParty: input.oppositeParty || null,
        filingDate: input.filingDate || null,
        nextSessionDate: input.nextSessionDate || null,
        priority: input.priority || "medium",
        budget: input.budget ? input.budget : null,
        notes: null,
        estimatedClosureDate: null,
        expenditure: "0",
        isDeleted: false,
        partyRole: null,
        status: "open"
      });
      await createAuditLog({
        matterId: null,
        projectId: null,
        userId: ctx.user.id,
        lawFirmId: ctx.lawFirmId,
        caseId: newCase.id,
        action: "CREATE",
        entityType: "case",
        entityId: newCase.id,
        changes: { created: newCase },
        ipAddress: ctx.req.headers["x-forwarded-for"] || null
      });
      await notifyOwner({
        title: "\u0642\u0636\u064A\u0629 \u062C\u062F\u064A\u062F\u0629",
        content: `\u062A\u0645 \u0625\u0636\u0627\u0641\u0629 \u0642\u0636\u064A\u0629 \u062C\u062F\u064A\u062F\u0629: ${input.title} (${input.caseNumber})`
      });
      return newCase;
    }),
    update: lawFirmProcedure.input(z2.object({
      id: z2.number(),
      title: z2.string().optional(),
      description: z2.string().optional(),
      status: z2.enum(["open", "pending", "closed", "archived", "suspended"]).optional(),
      nextSessionDate: z2.date().optional(),
      priority: z2.enum(["low", "medium", "high", "urgent"]).optional(),
      notes: z2.string().optional()
    })).mutation(async ({ input, ctx }) => {
      const caseData = await getCaseById(input.id);
      if (!caseData || caseData.lawFirmId !== ctx.lawFirmId) {
        throw new TRPCError3({ code: "NOT_FOUND" });
      }
      const updated = await updateCase(input.id, {
        title: input.title || caseData.title,
        description: input.description || caseData.description,
        status: input.status,
        nextSessionDate: input.nextSessionDate || caseData.nextSessionDate,
        priority: input.priority,
        notes: input.notes || caseData.notes
      });
      await createAuditLog({
        matterId: null,
        projectId: null,
        userId: ctx.user.id,
        lawFirmId: ctx.lawFirmId,
        caseId: input.id,
        action: "UPDATE",
        entityType: "case",
        entityId: input.id,
        changes: { before: caseData, after: updated },
        ipAddress: ctx.req.headers["x-forwarded-for"] || null
      });
      return updated;
    }),
    delete: lawFirmProcedure.input(z2.number()).mutation(async ({ input, ctx }) => {
      const caseData = await getCaseById(input);
      if (!caseData || caseData.lawFirmId !== ctx.lawFirmId) {
        throw new TRPCError3({ code: "NOT_FOUND" });
      }
      await softDeleteCase(input);
      await createAuditLog({
        matterId: null,
        projectId: null,
        userId: ctx.user.id,
        lawFirmId: ctx.lawFirmId,
        caseId: input,
        action: "DELETE",
        entityType: "case",
        entityId: input,
        changes: { deleted: caseData },
        ipAddress: ctx.req.headers["x-forwarded-for"] || null
      });
      return { success: true };
    })
  }),
  // ============ CLIENTS ROUTER ============
  clients: router({
    list: lawFirmProcedure.query(async ({ ctx }) => {
      return getClientsByLawFirm(ctx.lawFirmId);
    }),
    get: lawFirmProcedure.input(z2.number()).query(async ({ input, ctx }) => {
      const client = await getClientById(input);
      if (!client || client.lawFirmId !== ctx.lawFirmId) {
        throw new TRPCError3({ code: "NOT_FOUND" });
      }
      return client;
    }),
    create: lawFirmProcedure.input(z2.object({
      name: z2.string(),
      email: z2.string().email().optional(),
      phone: z2.string().optional(),
      address: z2.string().optional(),
      city: z2.string().optional(),
      nationalId: z2.string().optional(),
      clientType: z2.enum(["individual", "company"]).optional(),
      notes: z2.string().optional()
    })).mutation(async ({ input, ctx }) => {
      return createClient({
        lawFirmId: ctx.lawFirmId,
        name: input.name,
        email: input.email || null,
        phone: input.phone || null,
        address: input.address || null,
        city: input.city || null,
        nationalId: input.nationalId || null,
        clientType: input.clientType || "individual",
        kycStatus: "pending",
        conflictCheckStatus: "pending",
        notes: input.notes || null
      });
    })
  }),
  // ============ NOTIFICATIONS ROUTER ============
  notifications: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getUserNotifications(ctx.user.id);
    }),
    markAsRead: protectedProcedure.input(z2.number()).mutation(async ({ input }) => {
      await markNotificationAsRead(input);
      return { success: true };
    })
  }),
  // ============ DOCUMENTS ROUTER ============
  documents: router({
    listByCase: lawFirmProcedure.input(z2.number()).query(async ({ input, ctx }) => {
      const caseData = await getCaseById(input);
      if (!caseData || caseData.lawFirmId !== ctx.lawFirmId) {
        throw new TRPCError3({ code: "NOT_FOUND" });
      }
      return getDocumentsByCaseId(input);
    })
  }),
  // ============ AUDIT LOG ROUTER ============
  auditLogs: router({
    listByCase: lawFirmProcedure.input(z2.number()).query(async ({ input, ctx }) => {
      const caseData = await getCaseById(input);
      if (!caseData || caseData.lawFirmId !== ctx.lawFirmId) {
        throw new TRPCError3({ code: "NOT_FOUND" });
      }
      return getAuditLogsByCaseId(input);
    })
  })
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/vite.ts
import express from "express";
import fs2 from "fs";
import { nanoid } from "nanoid";
import path2 from "path";
import { createServer as createViteServer } from "vite";

// vite.config.ts
import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
var PROJECT_ROOT = import.meta.dirname;
var LOG_DIR = path.join(PROJECT_ROOT, ".manus-logs");
var MAX_LOG_SIZE_BYTES = 1 * 1024 * 1024;
var TRIM_TARGET_BYTES = Math.floor(MAX_LOG_SIZE_BYTES * 0.6);
function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}
function trimLogFile(logPath, maxSize) {
  try {
    if (!fs.existsSync(logPath) || fs.statSync(logPath).size <= maxSize) {
      return;
    }
    const lines = fs.readFileSync(logPath, "utf-8").split("\n");
    const keptLines = [];
    let keptBytes = 0;
    const targetSize = TRIM_TARGET_BYTES;
    for (let i = lines.length - 1; i >= 0; i--) {
      const lineBytes = Buffer.byteLength(`${lines[i]}
`, "utf-8");
      if (keptBytes + lineBytes > targetSize) break;
      keptLines.unshift(lines[i]);
      keptBytes += lineBytes;
    }
    fs.writeFileSync(logPath, keptLines.join("\n"), "utf-8");
  } catch {
  }
}
function writeToLogFile(source, entries) {
  if (entries.length === 0) return;
  ensureLogDir();
  const logPath = path.join(LOG_DIR, `${source}.log`);
  const lines = entries.map((entry) => {
    const ts = (/* @__PURE__ */ new Date()).toISOString();
    return `[${ts}] ${JSON.stringify(entry)}`;
  });
  fs.appendFileSync(logPath, `${lines.join("\n")}
`, "utf-8");
  trimLogFile(logPath, MAX_LOG_SIZE_BYTES);
}
function vitePluginManusDebugCollector() {
  return {
    name: "manus-debug-collector",
    transformIndexHtml(html) {
      if (process.env.NODE_ENV === "production") {
        return html;
      }
      return {
        html,
        tags: [
          {
            tag: "script",
            attrs: {
              src: "/__manus__/debug-collector.js",
              defer: true
            },
            injectTo: "head"
          }
        ]
      };
    },
    configureServer(server) {
      server.middlewares.use("/__manus__/logs", (req, res, next) => {
        if (req.method !== "POST") {
          return next();
        }
        const handlePayload = (payload) => {
          if (payload.consoleLogs?.length > 0) {
            writeToLogFile("browserConsole", payload.consoleLogs);
          }
          if (payload.networkRequests?.length > 0) {
            writeToLogFile("networkRequests", payload.networkRequests);
          }
          if (payload.sessionEvents?.length > 0) {
            writeToLogFile("sessionReplay", payload.sessionEvents);
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        };
        const reqBody = req.body;
        if (reqBody && typeof reqBody === "object") {
          try {
            handlePayload(reqBody);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
          return;
        }
        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });
        req.on("end", () => {
          try {
            const payload = JSON.parse(body);
            handlePayload(payload);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
        });
      });
    }
  };
}
var plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime(), vitePluginManusDebugCollector()];
var vite_config_default = defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1"
    ],
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/_core/vite.ts
async function setupVite(app, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    server: serverOptions,
    appType: "custom"
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app) {
  const distPath = process.env.NODE_ENV === "development" ? path2.resolve(import.meta.dirname, "../..", "dist", "public") : path2.resolve(import.meta.dirname, "public");
  if (!fs2.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/_core/index.ts
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(startPort = 3e3) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}
async function startServer() {
  const app = express2();
  const server = createServer(app);
  app.use(express2.json({ limit: "50mb" }));
  app.use(express2.urlencoded({ limit: "50mb", extended: true }));
  registerOAuthRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
startServer().catch(console.error);
