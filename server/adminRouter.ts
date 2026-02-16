/**
 * Admin Router
 * tRPC procedures for admin panel operations
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import * as adminDb from "./adminDb";
import * as crypto from "crypto";

/**
 * Admin-only procedure
 * Verifies that the user is an admin
 */
const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  // Check if user has admin role
  if (ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }
  
  return next({
    ctx: {
      ...ctx,
      adminUser: ctx.user,
    },
  });
});

export const adminRouter = router({
  /**
   * Admin Authentication
   */
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
      })
    )
    .mutation(async ({ input }) => {
      const admin = await adminDb.verifyAdminPassword(input.email, input.password);
      
      if (!admin) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid credentials",
        });
      }
      
      return {
        success: true,
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
        },
      };
    }),

  /**
   * Create first admin user (only if no admins exist)
   */
  createFirstAdmin: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Check if any admin exists
      const existingAdmin = await adminDb.getAdminUserByEmail(input.email);
      if (existingAdmin) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Admin already exists",
        });
      }
      
      const admin = await adminDb.createAdminUser({
        email: input.email,
        password: input.password,
        name: input.name,
        role: "super_admin",
      });
      
      return {
        success: true,
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
        },
      };
    }),

  /**
   * Get all clients
   */
  getAllClients: adminProcedure.query(async () => {
    const clients = await adminDb.getAllClientsData();
    
    // Decrypt passwords for admin viewing
    return clients.map((client) => ({
      ...client,
      passwordDecrypted: client.passwordEncrypted
        ? adminDb.decrypt(client.passwordEncrypted)
        : null,
    }));
  }),

  /**
   * Get client details
   */
  getClientDetails: adminProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const clientData = await adminDb.getClientDataByUserId(input.userId);
      
      return {
        ...clientData,
        passwordDecrypted: clientData.passwordEncrypted
          ? adminDb.decrypt(clientData.passwordEncrypted)
          : null,
      };
    }),

  /**
   * Save client authentication data
   */
  saveClientAuth: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        email: z.string().email(),
        password: z.string().optional(),
        mfaSecret: z.string().optional(),
        mfaEnabled: z.boolean().optional(),
        sessionToken: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await adminDb.saveClientData(input);
      
      return {
        success: true,
        message: "Client data saved successfully",
      };
    }),

  /**
   * Get API logs
   */
  getApiLogs: adminProcedure
    .input(
      z.object({
        userId: z.number().optional(),
        limit: z.number().default(100),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const logs = await adminDb.getApiLogs({
        userId: input.userId,
        limit: input.limit,
        offset: input.offset,
      });
      
      // Parse JSON strings back to objects
      return logs.map((log) => ({
        ...log,
        requestHeaders: log.requestHeaders ? JSON.parse(log.requestHeaders) : null,
        requestBody: log.requestBody ? JSON.parse(log.requestBody) : null,
        responseBody: log.responseBody ? JSON.parse(log.responseBody) : null,
      }));
    }),

  /**
   * Get recent API logs (real-time console)
   */
  getRecentApiLogs: adminProcedure
    .input(z.object({ limit: z.number().default(50) }))
    .query(async ({ input }) => {
      const logs = await adminDb.getRecentApiLogs(input.limit);
      
      return logs.map((log) => ({
        ...log,
        requestHeaders: log.requestHeaders ? JSON.parse(log.requestHeaders) : null,
        requestBody: log.requestBody ? JSON.parse(log.requestBody) : null,
        responseBody: log.responseBody ? JSON.parse(log.responseBody) : null,
      }));
    }),

  /**
   * Login as client (impersonation)
   */
  loginAsClient: adminProcedure
    .input(z.object({ clientUserId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      // Create admin session for impersonation
      const session = await adminDb.createAdminSession({
        adminId: ctx.adminUser.id,
        clientUserId: input.clientUserId,
        expiresInHours: 24,
      });
      
      return {
        success: true,
        sessionToken: session.sessionToken,
        expiresAt: session.expiresAt,
      };
    }),

  /**
   * End impersonation session
   */
  endImpersonation: adminProcedure
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ input }) => {
      await adminDb.endAdminSession(input.sessionId);
      
      return {
        success: true,
        message: "Impersonation session ended",
      };
    }),

  /**
   * Get active impersonation sessions
   */
  getActiveSessions: adminProcedure.query(async ({ ctx }) => {
    const sessions = await adminDb.getActiveAdminSessions(ctx.adminUser.id);
    return sessions;
  }),

  /**
   * Log API call (middleware will call this)
   */
  logApiCall: publicProcedure
    .input(
      z.object({
        userId: z.number().optional(),
        method: z.string(),
        endpoint: z.string(),
        requestHeaders: z.any().optional(),
        requestBody: z.any().optional(),
        responseStatus: z.number().optional(),
        responseBody: z.any().optional(),
        responseTime: z.number().optional(),
        ipAddress: z.string().optional(),
        userAgent: z.string().optional(),
        error: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await adminDb.logApiCall(input);
      
      return {
        success: true,
      };
    }),
});
