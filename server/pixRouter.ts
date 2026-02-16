import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import * as pixDb from "./pix";

export const pixRouter = router({
  // ========================================================================
  // PIX PAYMENTS
  // ========================================================================
  
  createPayment: protectedProcedure
    .input(z.object({
      amount: z.string(),
      currency: z.string().default("BRL"),
      pixKey: z.string().optional(),
      pixKeyType: z.enum(["EMAIL", "PHONE", "CPF", "CNPJ", "RANDOM"]).optional(),
      description: z.string().optional(),
      recipientName: z.string().optional(),
      recipientEmail: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Gerar QR Code mock
      const qrCode = `00020126580014br.gov.bcb.pix0136${input.pixKey || ctx.user.email}52040000530398654${input.amount.replace('.', '')}5802BR5913COCOS CAPITAL6009SAO PAULO62410503***63041D3D`;
      const qrCodeUrl = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==`;
      
      const payment = await pixDb.createPixPayment({
        userId: ctx.user.id,
        status: "PENDING_PAYMENT",
        amount: input.amount,
        currency: input.currency,
        pixKey: input.pixKey,
        pixKeyType: input.pixKeyType as any,
        qrCode,
        qrCodeUrl,
        description: input.description,
        recipientName: input.recipientName,
        recipientEmail: input.recipientEmail,
        expiresAt: new Date(Date.now() + 15 * 60000), // 15 minutos
      });

      return payment;
    }),

  getPayment: protectedProcedure
    .input(z.object({
      paymentId: z.string(),
    }))
    .query(async ({ input }) => {
      return pixDb.getPixPaymentByPaymentId(input.paymentId);
    }),

  listPayments: protectedProcedure
    .input(z.object({
      limit: z.number().optional().default(50),
    }))
    .query(async ({ ctx, input }) => {
      return pixDb.getUserPixPayments(ctx.user.id, input.limit);
    }),

  confirmPayment: protectedProcedure
    .input(z.object({
      paymentId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const transactionId = `TXN_${Date.now()}`;
      const confirmationCode = `CONF_${Math.random().toString(36).substr(2, 9)}`;
      
      return pixDb.updatePixPaymentStatus(input.paymentId, "COMPLETED", {
        status: "COMPLETED",
        transactionId,
        confirmationCode,
        completedAt: new Date(),
      });
    }),

  // ========================================================================
  // PIX KEYS
  // ========================================================================

  registerKey: protectedProcedure
    .input(z.object({
      keyType: z.enum(["EMAIL", "PHONE", "CPF", "CNPJ", "RANDOM"]),
      keyValue: z.string(),
      isPrimary: z.number().optional().default(0),
    }))
    .mutation(async ({ ctx, input }) => {
      return pixDb.createPixKey({
        userId: ctx.user.id,
        keyType: input.keyType,
        keyValue: input.keyValue,
        isPrimary: input.isPrimary,
        isActive: 1,
      });
    }),

  listKeys: protectedProcedure
    .query(async ({ ctx }) => {
      return pixDb.getUserPixKeys(ctx.user.id);
    }),

  deleteKey: protectedProcedure
    .input(z.object({
      keyValue: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      await pixDb.deletePixKey(ctx.user.id, input.keyValue);
      return { success: true };
    }),

  // ========================================================================
  // TRANSFERS
  // ========================================================================

  sendTransfer: protectedProcedure
    .input(z.object({
      type: z.enum(["PIX", "TED", "DOC", "INTERNAL"]),
      amount: z.string(),
      currency: z.string().default("BRL"),
      recipientName: z.string(),
      recipientEmail: z.string().optional(),
      recipientPixKey: z.string().optional(),
      recipientBank: z.string().optional(),
      recipientBranch: z.string().optional(),
      recipientAccount: z.string().optional(),
      description: z.string().optional(),
      scheduledFor: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const transfer = await pixDb.createTransfer({
        userId: ctx.user.id,
        type: input.type,
        direction: "SENT",
        status: input.scheduledFor ? "PENDING" : "PROCESSING",
        amount: input.amount,
        currency: input.currency,
        senderName: ctx.user.name,
        senderEmail: ctx.user.email,
        recipientName: input.recipientName,
        recipientEmail: input.recipientEmail,
        recipientPixKey: input.recipientPixKey,
        recipientBank: input.recipientBank,
        recipientBranch: input.recipientBranch,
        recipientAccount: input.recipientAccount,
        description: input.description,
        scheduledFor: input.scheduledFor,
        transactionId: `TXN_${Date.now()}`,
        confirmationCode: `CONF_${Math.random().toString(36).substr(2, 9)}`,
        completedAt: input.scheduledFor ? undefined : new Date(),
      });

      // Se não for agendada, marcar como completada imediatamente
      if (!input.scheduledFor) {
        return pixDb.updateTransferStatus(transfer.transferId, "COMPLETED", {
          completedAt: new Date(),
        });
      }

      return transfer;
    }),

  listTransfers: protectedProcedure
    .input(z.object({
      limit: z.number().optional().default(50),
    }))
    .query(async ({ ctx, input }) => {
      return pixDb.getUserTransfers(ctx.user.id, input.limit);
    }),

  getTransfer: protectedProcedure
    .input(z.object({
      transferId: z.string(),
    }))
    .query(async ({ input }) => {
      return pixDb.getTransferByTransferId(input.transferId);
    }),

  // ========================================================================
  // CONTACTS
  // ========================================================================

  addContact: protectedProcedure
    .input(z.object({
      name: z.string(),
      email: z.string().optional(),
      pixKey: z.string().optional(),
      pixKeyType: z.enum(["EMAIL", "PHONE", "CPF", "CNPJ", "RANDOM"]).optional(),
      bank: z.string().optional(),
      branch: z.string().optional(),
      account: z.string().optional(),
      isFavorite: z.number().optional().default(0),
    }))
    .mutation(async ({ ctx, input }) => {
      return pixDb.createContact({
        userId: ctx.user.id,
        ...input,
      });
    }),

  listContacts: protectedProcedure
    .query(async ({ ctx }) => {
      return pixDb.getUserContacts(ctx.user.id);
    }),

  deleteContact: protectedProcedure
    .input(z.object({
      contactId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      await pixDb.deleteContact(ctx.user.id, input.contactId);
      return { success: true };
    }),

  updateContact: protectedProcedure
    .input(z.object({
      contactId: z.number(),
      name: z.string().optional(),
      email: z.string().optional(),
      pixKey: z.string().optional(),
      pixKeyType: z.enum(["EMAIL", "PHONE", "CPF", "CNPJ", "RANDOM"]).optional(),
      bank: z.string().optional(),
      branch: z.string().optional(),
      account: z.string().optional(),
      isFavorite: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { contactId, ...updates } = input;
      return pixDb.updateContact(ctx.user.id, contactId, updates);
    }),
});
