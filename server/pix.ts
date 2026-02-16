import { eq, desc, and } from "drizzle-orm";
import { pixPayments, transfers, pixKeys, contacts, InsertPixPayment, InsertTransfer, InsertPixKey, InsertContact } from "../drizzle/schema";
import { getDb } from "./db";
import { nanoid } from "nanoid";

// ============================================================================
// PIX PAYMENTS
// ============================================================================

export async function createPixPayment(data: Omit<InsertPixPayment, "paymentId" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const paymentId = `PIX_${nanoid(16)}`;
  
  await db.insert(pixPayments).values({
    ...data,
    paymentId,
  });

  return getPixPaymentByPaymentId(paymentId);
}

export async function getPixPaymentByPaymentId(paymentId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(pixPayments).where(eq(pixPayments.paymentId, paymentId)).limit(1);
  return result[0];
}

export async function getUserPixPayments(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(pixPayments).where(eq(pixPayments.userId, userId)).orderBy(desc(pixPayments.createdAt)).limit(limit);
}

export async function updatePixPaymentStatus(paymentId: string, status: string, updates?: Partial<InsertPixPayment>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(pixPayments).set({
    status: status as any,
    ...updates,
    updatedAt: new Date(),
  }).where(eq(pixPayments.paymentId, paymentId));

  return getPixPaymentByPaymentId(paymentId);
}

// ============================================================================
// TRANSFERS
// ============================================================================

export async function createTransfer(data: Omit<InsertTransfer, "transferId" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const transferId = `TRF_${nanoid(16)}`;
  
  await db.insert(transfers).values({
    ...data,
    transferId,
  });

  return getTransferByTransferId(transferId);
}

export async function getTransferByTransferId(transferId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(transfers).where(eq(transfers.transferId, transferId)).limit(1);
  return result[0];
}

export async function getUserTransfers(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(transfers).where(eq(transfers.userId, userId)).orderBy(desc(transfers.createdAt)).limit(limit);
}

export async function updateTransferStatus(transferId: string, status: string, updates?: Partial<InsertTransfer>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(transfers).set({
    status: status as any,
    ...updates,
    updatedAt: new Date(),
  }).where(eq(transfers.transferId, transferId));

  return getTransferByTransferId(transferId);
}

// ============================================================================
// PIX KEYS
// ============================================================================

export async function createPixKey(data: Omit<InsertPixKey, "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(pixKeys).values(data);

  const result = await db.select().from(pixKeys)
    .where(and(eq(pixKeys.userId, data.userId), eq(pixKeys.keyValue, data.keyValue)))
    .limit(1);
  
  return result[0];
}

export async function getUserPixKeys(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(pixKeys).where(eq(pixKeys.userId, userId)).orderBy(desc(pixKeys.isPrimary));
}

export async function deletePixKey(userId: number, keyValue: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(pixKeys).set({
    isActive: 0,
    updatedAt: new Date(),
  }).where(and(eq(pixKeys.userId, userId), eq(pixKeys.keyValue, keyValue)));
}

// ============================================================================
// CONTACTS
// ============================================================================

export async function createContact(data: Omit<InsertContact, "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(contacts).values(data);
  
  const inserted = await db.select().from(contacts).where(eq(contacts.id, result.insertId)).limit(1);
  return inserted[0];
}

export async function getUserContacts(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(contacts).where(eq(contacts.userId, userId)).orderBy(desc(contacts.isFavorite), desc(contacts.createdAt));
}

export async function deleteContact(userId: number, contactId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(contacts).where(and(eq(contacts.userId, userId), eq(contacts.id, contactId)));
}

export async function updateContact(userId: number, contactId: number, updates: Partial<InsertContact>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(contacts).set({
    ...updates,
    updatedAt: new Date(),
  }).where(and(eq(contacts.userId, userId), eq(contacts.id, contactId)));

  const result = await db.select().from(contacts).where(eq(contacts.id, contactId)).limit(1);
  return result[0];
}
