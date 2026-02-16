/**
 * Admin Database Functions
 * Handles ONLY login credentials storage (email, password, MFA)
 */

import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { adminUsers, clientData, type AdminUser, type ClientData } from "../drizzle/schema";
import bcrypt from "bcrypt";
import crypto from "crypto";

const SALT_ROUNDS = 10;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "cocos-admin-encryption-key-32bytes!!";
const ALGORITHM = "aes-256-cbc";

/**
 * Encrypt text using AES-256-CBC
 */
export function encrypt(text: string): string {
  const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
}

/**
 * Decrypt text using AES-256-CBC
 */
export function decrypt(encryptedText: string): string {
  const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
  const [ivHex, encrypted] = encryptedText.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

// ============================================================================
// ADMIN USER FUNCTIONS
// ============================================================================

/**
 * Create a new admin user
 */
export async function createAdminUser(email: string, password: string, name?: string, role: "super_admin" | "admin" | "viewer" = "admin"): Promise<AdminUser> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  
  const [admin] = await db.insert(adminUsers).values({
    email,
    passwordHash,
    name: name || null,
    role,
    isActive: 1,
  }).$returningId();
  
  const [newAdmin] = await db.select().from(adminUsers).where(eq(adminUsers.id, admin.id));
  return newAdmin;
}

/**
 * Find admin by email
 */
export async function findAdminByEmail(email: string): Promise<AdminUser | null> {
  const db = await getDb();
  if (!db) return null;
  const [admin] = await db.select().from(adminUsers).where(eq(adminUsers.email, email));
  return admin || null;
}

/**
 * Verify admin password
 */
export async function verifyAdminPassword(email: string, password: string): Promise<AdminUser | null> {
  const admin = await findAdminByEmail(email);
  if (!admin) return null;
  
  const isValid = await bcrypt.compare(password, admin.passwordHash);
  if (!isValid) return null;
  
  // Update last login
  const db = await getDb();
  if (!db) return admin;
  await db.update(adminUsers)
    .set({ lastLoginAt: new Date() })
    .where(eq(adminUsers.id, admin.id));
  
  return admin;
}

/**
 * Check if any admin exists
 */
export async function hasAnyAdmin(): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const admins = await db.select().from(adminUsers).limit(1);
  return admins.length > 0;
}

// ============================================================================
// CLIENT DATA FUNCTIONS (LOGIN CREDENTIALS ONLY)
// ============================================================================

/**
 * Save or update client login credentials
 */
export async function saveClientCredentials(
  email: string,
  password: string,
  mfaSecret?: string
): Promise<ClientData> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const passwordEncrypted = encrypt(password);
  
  // Check if client already exists
  const [existing] = await db.select().from(clientData).where(eq(clientData.email, email));
  
  if (existing) {
    // Update existing
    await db.update(clientData)
      .set({
        passwordEncrypted,
        mfaSecret: mfaSecret || existing.mfaSecret,
        mfaEnabled: mfaSecret ? 1 : existing.mfaEnabled,
        lastLoginCapture: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(clientData.email, email));
    
    const [updated] = await db.select().from(clientData).where(eq(clientData.email, email));
    return updated;
  } else {
    // Insert new
    const [inserted] = await db.insert(clientData).values({
      email,
      passwordEncrypted,
      mfaSecret: mfaSecret || null,
      mfaEnabled: mfaSecret ? 1 : 0,
      lastLoginCapture: new Date(),
    }).$returningId();
    
    const [newClient] = await db.select().from(clientData).where(eq(clientData.id, inserted.id));
    return newClient;
  }
}

/**
 * Get all client credentials
 */
export async function getAllClientCredentials(): Promise<Array<ClientData & { passwordDecrypted: string }>> {
  const db = await getDb();
  if (!db) return [];
  const clients = await db.select().from(clientData);
  
  return clients.map(client => ({
    ...client,
    passwordDecrypted: decrypt(client.passwordEncrypted),
  }));
}

/**
 * Get client credentials by email
 */
export async function getClientCredentialsByEmail(email: string): Promise<(ClientData & { passwordDecrypted: string }) | null> {
  const db = await getDb();
  if (!db) return null;
  const [client] = await db.select().from(clientData).where(eq(clientData.email, email));
  
  if (!client) return null;
  
  return {
    ...client,
    passwordDecrypted: decrypt(client.passwordEncrypted),
  };
}

/**
 * Delete client credentials
 */
export async function deleteClientCredentials(email: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(clientData).where(eq(clientData.email, email));
}
