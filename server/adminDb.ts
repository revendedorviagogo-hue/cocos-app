/**
 * Admin Database Functions
 * Helper functions for admin panel operations
 */

import { eq, desc, and, isNull } from "drizzle-orm";
import { getDb } from "./db";
import {
  adminUsers,
  clientData,
  apiLogs,
  adminSessions,
  users,
  type AdminUser,
  type InsertAdminUser,
  type ClientData,
  type InsertClientData,
  type ApiLog,
  type InsertApiLog,
  type AdminSession,
  type InsertAdminSession,
} from "../drizzle/schema";
import * as crypto from "crypto";
import * as bcrypt from "bcrypt";

const SALT_ROUNDS = 10;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "cocos-admin-encryption-key-32bytes!!";
const ENCRYPTION_ALGORITHM = "aes-256-cbc";

/**
 * Encrypt sensitive data
 */
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

/**
 * Decrypt sensitive data
 */
export function decrypt(text: string): string {
  const parts = text.split(":");
  const iv = Buffer.from(parts[0], "hex");
  const encryptedText = parts[1];
  const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

/**
 * Admin Users
 */

export async function createAdminUser(data: {
  email: string;
  password: string;
  name?: string;
  role?: "super_admin" | "admin" | "viewer";
}): Promise<AdminUser> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
  const [admin] = await db.insert(adminUsers).values({
    email: data.email,
    passwordHash,
    name: data.name,
    role: data.role || "admin",
  });
  return getAdminUserById(admin.insertId);
}

export async function getAdminUserByEmail(email: string): Promise<AdminUser | null> {
  const db = await getDb();
  if (!db) return null;
  
  const [admin] = await db.select().from(adminUsers).where(eq(adminUsers.email, email)).limit(1);
  return admin || null;
}

export async function getAdminUserById(id: number): Promise<AdminUser> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [admin] = await db.select().from(adminUsers).where(eq(adminUsers.id, id)).limit(1);
  if (!admin) throw new Error("Admin not found");
  return admin;
}

export async function verifyAdminPassword(email: string, password: string): Promise<AdminUser | null> {
  const admin = await getAdminUserByEmail(email);
  if (!admin) return null;
  
  const isValid = await bcrypt.compare(password, admin.passwordHash);
  if (!isValid) return null;
  
  // Update last login
  const db = await getDb();
  if (db) {
    await db.update(adminUsers)
      .set({ lastLoginAt: new Date() })
      .where(eq(adminUsers.id, admin.id));
  }
  
  return admin;
}

/**
 * Client Data
 */

export async function saveClientData(data: {
  userId: number;
  email: string;
  password?: string;
  mfaSecret?: string;
  mfaEnabled?: boolean;
  sessionToken?: string;
}): Promise<ClientData> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await db.select().from(clientData).where(eq(clientData.userId, data.userId)).limit(1);
  
  const clientDataValues: any = {
    userId: data.userId,
    email: data.email,
    passwordEncrypted: data.password ? encrypt(data.password) : undefined,
    mfaSecret: data.mfaSecret,
    mfaEnabled: data.mfaEnabled ? 1 : 0,
    sessionToken: data.sessionToken,
    lastApiCall: new Date(),
    updatedAt: new Date(),
  };
  
  if (existing.length > 0) {
    // Update existing
    await db.update(clientData)
      .set(clientDataValues)
      .where(eq(clientData.userId, data.userId));
  } else {
    // Insert new
    await db.insert(clientData).values(clientDataValues);
  }
  
  return getClientDataByUserId(data.userId);
}

export async function getClientDataByUserId(userId: number): Promise<ClientData> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [data] = await db.select().from(clientData).where(eq(clientData.userId, userId)).limit(1);
  if (!data) throw new Error("Client data not found");
  return data;
}

export async function getAllClientsData(): Promise<Array<ClientData & { user: any }>> {
  const db = await getDb();
  if (!db) return [];
  
  const clients = await db
    .select({
      clientData: clientData,
      user: users,
    })
    .from(clientData)
    .leftJoin(users, eq(clientData.userId, users.id))
    .orderBy(desc(clientData.updatedAt));
  
  return clients.map((c: any) => ({
    ...c.clientData,
    user: c.user,
  }));
}

export async function incrementApiCallCount(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  const existing = await db.select().from(clientData).where(eq(clientData.userId, userId)).limit(1);
  if (existing.length > 0) {
    await db.update(clientData)
      .set({
        apiCallCount: (existing[0].apiCallCount || 0) + 1,
        lastApiCall: new Date(),
      })
      .where(eq(clientData.userId, userId));
  }
}

/**
 * API Logs
 */

export async function logApiCall(data: {
  userId?: number;
  method: string;
  endpoint: string;
  requestHeaders?: any;
  requestBody?: any;
  responseStatus?: number;
  responseBody?: any;
  responseTime?: number;
  ipAddress?: string;
  userAgent?: string;
  error?: string;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.insert(apiLogs).values({
    userId: data.userId,
    method: data.method,
    endpoint: data.endpoint,
    requestHeaders: data.requestHeaders ? JSON.stringify(data.requestHeaders) : null,
    requestBody: data.requestBody ? JSON.stringify(data.requestBody) : null,
    responseStatus: data.responseStatus,
    responseBody: data.responseBody ? JSON.stringify(data.responseBody) : null,
    responseTime: data.responseTime,
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
    error: data.error,
  });
}

export async function getApiLogs(options: {
  userId?: number;
  limit?: number;
  offset?: number;
}): Promise<ApiLog[]> {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(apiLogs);
  
  if (options.userId) {
    query = query.where(eq(apiLogs.userId, options.userId)) as any;
  }
  
  query = query.orderBy(desc(apiLogs.createdAt)) as any;
  
  if (options.limit) {
    query = query.limit(options.limit) as any;
  }
  
  if (options.offset) {
    query = query.offset(options.offset) as any;
  }
  
  return query;
}

export async function getRecentApiLogs(limit: number = 100): Promise<ApiLog[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(apiLogs).orderBy(desc(apiLogs.createdAt)).limit(limit);
}

/**
 * Admin Sessions (Impersonation)
 */

export async function createAdminSession(data: {
  adminId: number;
  clientUserId: number;
  ipAddress?: string;
  userAgent?: string;
  expiresInHours?: number;
}): Promise<AdminSession> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const sessionToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + (data.expiresInHours || 24));
  
  const [session] = await db.insert(adminSessions).values({
    adminId: data.adminId,
    clientUserId: data.clientUserId,
    sessionToken,
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
    expiresAt,
  });
  
  return getAdminSessionById(session.insertId);
}

export async function getAdminSessionById(id: number): Promise<AdminSession> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [session] = await db.select().from(adminSessions).where(eq(adminSessions.id, id)).limit(1);
  if (!session) throw new Error("Admin session not found");
  return session;
}

export async function getAdminSessionByToken(token: string): Promise<AdminSession | null> {
  const db = await getDb();
  if (!db) return null;
  
  const [session] = await db.select().from(adminSessions).where(eq(adminSessions.sessionToken, token)).limit(1);
  return session || null;
}

export async function endAdminSession(sessionId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.update(adminSessions)
    .set({ endedAt: new Date() })
    .where(eq(adminSessions.id, sessionId));
}

export async function getActiveAdminSessions(adminId: number): Promise<AdminSession[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(adminSessions)
    .where(
      and(
        eq(adminSessions.adminId, adminId),
        isNull(adminSessions.endedAt)
      )
    )
    .orderBy(desc(adminSessions.createdAt));
}
