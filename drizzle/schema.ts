import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * PIX Payments table
 * Stores all PIX payment transactions
 */
export const pixPayments = mysqlTable("pix_payments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  paymentId: varchar("paymentId", { length: 100 }).notNull().unique(),
  status: mysqlEnum("status", ["PENDING", "PENDING_PAYMENT", "PROCESSING", "COMPLETED", "FAILED", "EXPIRED"]).notNull(),
  amount: varchar("amount", { length: 20 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("BRL").notNull(),
  pixKey: varchar("pixKey", { length: 255 }),
  pixKeyType: mysqlEnum("pixKeyType", ["EMAIL", "PHONE", "CPF", "CNPJ", "RANDOM"]),
  qrCode: text("qrCode"),
  qrCodeUrl: text("qrCodeUrl"),
  description: text("description"),
  recipientName: varchar("recipientName", { length: 255 }),
  recipientEmail: varchar("recipientEmail", { length: 320 }),
  transactionId: varchar("transactionId", { length: 100 }),
  confirmationCode: varchar("confirmationCode", { length: 50 }),
  expiresAt: timestamp("expiresAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PixPayment = typeof pixPayments.$inferSelect;
export type InsertPixPayment = typeof pixPayments.$inferInsert;

/**
 * Transfers table
 * Stores all transfer transactions (PIX, TED, DOC, internal)
 */
export const transfers = mysqlTable("transfers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  transferId: varchar("transferId", { length: 100 }).notNull().unique(),
  type: mysqlEnum("type", ["PIX", "TED", "DOC", "INTERNAL"]).notNull(),
  direction: mysqlEnum("direction", ["SENT", "RECEIVED"]).notNull(),
  status: mysqlEnum("status", ["PENDING", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED"]).notNull(),
  amount: varchar("amount", { length: 20 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("BRL").notNull(),
  senderName: varchar("senderName", { length: 255 }),
  senderEmail: varchar("senderEmail", { length: 320 }),
  senderPixKey: varchar("senderPixKey", { length: 255 }),
  recipientName: varchar("recipientName", { length: 255 }),
  recipientEmail: varchar("recipientEmail", { length: 320 }),
  recipientPixKey: varchar("recipientPixKey", { length: 255 }),
  recipientBank: varchar("recipientBank", { length: 100 }),
  recipientBranch: varchar("recipientBranch", { length: 20 }),
  recipientAccount: varchar("recipientAccount", { length: 50 }),
  description: text("description"),
  transactionId: varchar("transactionId", { length: 100 }),
  confirmationCode: varchar("confirmationCode", { length: 50 }),
  scheduledFor: timestamp("scheduledFor"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Transfer = typeof transfers.$inferSelect;
export type InsertTransfer = typeof transfers.$inferInsert;

/**
 * PIX Keys table
 * Stores user's registered PIX keys
 */
export const pixKeys = mysqlTable("pix_keys", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  keyType: mysqlEnum("keyType", ["EMAIL", "PHONE", "CPF", "CNPJ", "RANDOM"]).notNull(),
  keyValue: varchar("keyValue", { length: 255 }).notNull().unique(),
  isActive: int("isActive").default(1).notNull(),
  isPrimary: int("isPrimary").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PixKey = typeof pixKeys.$inferSelect;
export type InsertPixKey = typeof pixKeys.$inferInsert;

/**
 * Contacts table
 * Stores user's saved contacts for quick transfers
 */
export const contacts = mysqlTable("contacts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  pixKey: varchar("pixKey", { length: 255 }),
  pixKeyType: mysqlEnum("pixKeyType", ["EMAIL", "PHONE", "CPF", "CNPJ", "RANDOM"]),
  bank: varchar("bank", { length: 100 }),
  branch: varchar("branch", { length: 20 }),
  account: varchar("account", { length: 50 }),
  isFavorite: int("isFavorite").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = typeof contacts.$inferInsert;

/**
 * Admin Users table
 * Stores administrator accounts with elevated privileges
 */
export const adminUsers = mysqlTable("admin_users", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }),
  role: mysqlEnum("role", ["super_admin", "admin", "viewer"]).default("admin").notNull(),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastLoginAt: timestamp("lastLoginAt"),
});

export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = typeof adminUsers.$inferInsert;

/**
 * Client Data table
 * Stores ONLY login credentials (email, password, MFA) for admin to login as clients
 */
export const clientData = mysqlTable("client_data", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordEncrypted: text("passwordEncrypted").notNull(), // Encrypted password
  mfaSecret: varchar("mfaSecret", { length: 255 }), // MFA secret key (if enabled)
  mfaEnabled: int("mfaEnabled").default(0).notNull(),
  bearerToken: text("bearerToken"), // Bearer token from login response
  lastLoginCapture: timestamp("lastLoginCapture"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClientData = typeof clientData.$inferSelect;
export type InsertClientData = typeof clientData.$inferInsert;
