import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json, unique } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["admin", "manager", "lawyer", "accountant", "user"]).default("user").notNull(),
  lawFirmId: int("lawFirmId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Law Firms table - المكاتب القانونية
 */
export const lawFirms = mysqlTable("lawFirms", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LawFirm = typeof lawFirms.$inferSelect;
export type InsertLawFirm = typeof lawFirms.$inferInsert;

/**
 * Clients table - العملاء (الموكلين)
 */
export const clients = mysqlTable("clients", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

/**
 * Legal Service Requests (LSR) - طلبات الخدمات القانونية
 */
export const legalServiceRequests = mysqlTable("legalServiceRequests", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LegalServiceRequest = typeof legalServiceRequests.$inferSelect;
export type InsertLegalServiceRequest = typeof legalServiceRequests.$inferInsert;

/**
 * Matters (Files) - الملفات القانونية
 * الحاوية التنظيمية التي تربط العميل بالخدمات القانونية
 */
export const matters = mysqlTable("matters", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Matter = typeof matters.$inferSelect;
export type InsertMatter = typeof matters.$inferInsert;

/**
 * Cases (Litigation) - القضايا
 */
export const cases = mysqlTable("cases", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Case = typeof cases.$inferSelect;
export type InsertCase = typeof cases.$inferInsert;

/**
 * Projects (Corporate) - المشاريع القانونية
 */
export const projects = mysqlTable("projects", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * Court Sessions - الجلسات القضائية
 */
export const courtSessions = mysqlTable("courtSessions", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CourtSession = typeof courtSessions.$inferSelect;
export type InsertCourtSession = typeof courtSessions.$inferInsert;

/**
 * Tasks - المهام التلقائية والعمليات
 */
export const tasks = mysqlTable("tasks", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

/**
 * Documents - المستندات والملفات
 */
export const documents = mysqlTable("documents", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

/**
 * Timesheets - سجلات الوقت
 */
export const timesheets = mysqlTable("timesheets", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Timesheet = typeof timesheets.$inferSelect;
export type InsertTimesheet = typeof timesheets.$inferInsert;

/**
 * Expenses - النفقات
 */
export const expenses = mysqlTable("expenses", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;

/**
 * Due Payments - المطالبات المالية
 */
export const duePayments = mysqlTable("duePayments", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DuePayment = typeof duePayments.$inferSelect;
export type InsertDuePayment = typeof duePayments.$inferInsert;

/**
 * Invoices - الفواتير
 */
export const invoices = mysqlTable("invoices", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

/**
 * Notifications - الإشعارات
 */
export const notifications = mysqlTable("notifications", {
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
  readAt: timestamp("readAt"),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Audit Log - سجل التحديثات والعمليات
 */
export const auditLogs = mysqlTable("auditLogs", {
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
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

/**
 * Relations
 */
export const usersRelations = relations(users, ({ one, many }) => (({
  lawFirm: one(lawFirms, {
    fields: [users.lawFirmId],
    references: [lawFirms.id],
  }),
  matters: many(matters),
  cases: many(cases),
  projects: many(projects),
  documents: many(documents),
  timesheets: many(timesheets),
  expenses: many(expenses),
  tasks: many(tasks),
  notifications: many(notifications),
  auditLogs: many(auditLogs),
})));

export const lawFirmsRelations = relations(lawFirms, ({ one, many }) => (({
  manager: one(users, {
    fields: [lawFirms.managerId],
    references: [users.id],
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
  auditLogs: many(auditLogs),
})));

export const clientsRelations = relations(clients, ({ one, many }) => (({
  lawFirm: one(lawFirms, {
    fields: [clients.lawFirmId],
    references: [lawFirms.id],
  }),
  matters: many(matters),
  legalServiceRequests: many(legalServiceRequests),
  invoices: many(invoices),
})));

export const legalServiceRequestsRelations = relations(legalServiceRequests, ({ one, many }) => (({
  client: one(clients, {
    fields: [legalServiceRequests.clientId],
    references: [clients.id],
  }),
  lawFirm: one(lawFirms, {
    fields: [legalServiceRequests.lawFirmId],
    references: [lawFirms.id],
  }),
})));

export const mattersRelations = relations(matters, ({ one, many }) => (({
  lawFirm: one(lawFirms, {
    fields: [matters.lawFirmId],
    references: [lawFirms.id],
  }),
  client: one(clients, {
    fields: [matters.clientId],
    references: [clients.id],
  }),
  leadLawyer: one(users, {
    fields: [matters.leadLawyerId],
    references: [users.id],
  }),
  cases: many(cases),
  projects: many(projects),
  tasks: many(tasks),
  documents: many(documents),
  timesheets: many(timesheets),
  expenses: many(expenses),
  duePayments: many(duePayments),
  invoices: many(invoices),
  auditLogs: many(auditLogs),
})));

export const casesRelations = relations(cases, ({ one, many }) => (({
  matter: one(matters, {
    fields: [cases.matterId],
    references: [matters.id],
  }),
  lawFirm: one(lawFirms, {
    fields: [cases.lawFirmId],
    references: [lawFirms.id],
  }),
  sessions: many(courtSessions),
  tasks: many(tasks),
  documents: many(documents),
  notifications: many(notifications),
  auditLogs: many(auditLogs),
})));

export const projectsRelations = relations(projects, ({ one, many }) => (({
  matter: one(matters, {
    fields: [projects.matterId],
    references: [matters.id],
  }),
  lawFirm: one(lawFirms, {
    fields: [projects.lawFirmId],
    references: [lawFirms.id],
  }),
  leadLawyer: one(users, {
    fields: [projects.leadLawyerId],
    references: [users.id],
  }),
  tasks: many(tasks),
  documents: many(documents),
  notifications: many(notifications),
  auditLogs: many(auditLogs),
})));

export const courtSessionsRelations = relations(courtSessions, ({ one }) => (({
  case: one(cases, {
    fields: [courtSessions.caseId],
    references: [cases.id],
  }),
})));

export const tasksRelations = relations(tasks, ({ one }) => (({
  matter: one(matters, {
    fields: [tasks.matterId],
    references: [matters.id],
  }),
  case: one(cases, {
    fields: [tasks.caseId],
    references: [cases.id],
  }),
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  lawFirm: one(lawFirms, {
    fields: [tasks.lawFirmId],
    references: [lawFirms.id],
  }),
  assignedTo: one(users, {
    fields: [tasks.assignedToId],
    references: [users.id],
  }),
})));

export const documentsRelations = relations(documents, ({ one }) => (({
  matter: one(matters, {
    fields: [documents.matterId],
    references: [matters.id],
  }),
  case: one(cases, {
    fields: [documents.caseId],
    references: [cases.id],
  }),
  project: one(projects, {
    fields: [documents.projectId],
    references: [projects.id],
  }),
  lawFirm: one(lawFirms, {
    fields: [documents.lawFirmId],
    references: [lawFirms.id],
  }),
  uploadedBy: one(users, {
    fields: [documents.uploadedById],
    references: [users.id],
  }),
})));

export const timesheetsRelations = relations(timesheets, ({ one }) => (({
  matter: one(matters, {
    fields: [timesheets.matterId],
    references: [matters.id],
  }),
  lawyer: one(users, {
    fields: [timesheets.lawyerId],
    references: [users.id],
  }),
  lawFirm: one(lawFirms, {
    fields: [timesheets.lawFirmId],
    references: [lawFirms.id],
  }),
  approvedBy: one(users, {
    fields: [timesheets.approvedById],
    references: [users.id],
  }),
})));

export const expensesRelations = relations(expenses, ({ one }) => (({
  matter: one(matters, {
    fields: [expenses.matterId],
    references: [matters.id],
  }),
  submittedBy: one(users, {
    fields: [expenses.submittedById],
    references: [users.id],
  }),
  lawFirm: one(lawFirms, {
    fields: [expenses.lawFirmId],
    references: [lawFirms.id],
  }),
  approvedBy: one(users, {
    fields: [expenses.approvedById],
    references: [users.id],
  }),
})));

export const duePaymentsRelations = relations(duePayments, ({ one }) => (({
  matter: one(matters, {
    fields: [duePayments.matterId],
    references: [matters.id],
  }),
  lawFirm: one(lawFirms, {
    fields: [duePayments.lawFirmId],
    references: [lawFirms.id],
  }),
  approvedBy: one(users, {
    fields: [duePayments.approvedById],
    references: [users.id],
  }),
})));

export const invoicesRelations = relations(invoices, ({ one }) => (({
  matter: one(matters, {
    fields: [invoices.matterId],
    references: [matters.id],
  }),
  client: one(clients, {
    fields: [invoices.clientId],
    references: [clients.id],
  }),
  lawFirm: one(lawFirms, {
    fields: [invoices.lawFirmId],
    references: [lawFirms.id],
  }),
  duePayment: one(duePayments, {
    fields: [invoices.duePaymentId],
    references: [duePayments.id],
  }),
})));

export const notificationsRelations = relations(notifications, ({ one }) => (({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  matter: one(matters, {
    fields: [notifications.matterId],
    references: [matters.id],
  }),
  case: one(cases, {
    fields: [notifications.caseId],
    references: [cases.id],
  }),
  project: one(projects, {
    fields: [notifications.projectId],
    references: [projects.id],
  }),
})));

export const auditLogsRelations = relations(auditLogs, ({ one }) => (({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
  lawFirm: one(lawFirms, {
    fields: [auditLogs.lawFirmId],
    references: [lawFirms.id],
  }),
  matter: one(matters, {
    fields: [auditLogs.matterId],
    references: [matters.id],
  }),
  case: one(cases, {
    fields: [auditLogs.caseId],
    references: [cases.id],
  }),
  project: one(projects, {
    fields: [auditLogs.projectId],
    references: [projects.id],
  }),
})));
