/**
 * Admin Router
 * tRPC routes for admin panel - ONLY login credentials management
 */

import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import * as adminDb from "./adminDb";

/**
 * Admin procedure - requires admin authentication
 */
const adminProcedure = publicProcedure.use(async ({ ctx, next }) => {
  // TODO: Implement proper admin session management
  // For now, we'll use a simple token-based auth
  return next({ ctx });
});

export const adminRouter = router({
  /**
   * Admin login
   */
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
      })
    )
    .mutation(async ({ input }) => {
      const admin = await adminDb.verifyAdminPassword(input.email, input.password);
      
      if (!admin) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Email ou senha inválidos",
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
   * Create first admin (only if no admins exist)
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
      const hasAdmin = await adminDb.hasAnyAdmin();
      if (hasAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Já existe um administrador cadastrado",
        });
      }
      
      const admin = await adminDb.createAdminUser(
        input.email,
        input.password,
        input.name,
        "super_admin"
      );
      
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
   * Save client login credentials (called by auth-interceptor.js)
   */
  saveClientAuth: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
        mfaSecret: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await adminDb.saveClientCredentials(
          input.email,
          input.password,
          input.mfaSecret
        );
        
        return { success: true };
      } catch (error) {
        console.error("[Admin] Error saving client auth:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao salvar credenciais do cliente",
        });
      }
    }),

  /**
   * Get all client credentials
   */
  getAllClients: adminProcedure.query(async () => {
    try {
      const clients = await adminDb.getAllClientCredentials();
      return clients;
    } catch (error) {
      console.error("[Admin] Error getting clients:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao buscar clientes",
      });
    }
  }),

  /**
   * Get client credentials by email
   */
  getClientByEmail: adminProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
      try {
        const client = await adminDb.getClientCredentialsByEmail(input.email);
        if (!client) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Cliente não encontrado",
          });
        }
        return client;
      } catch (error) {
        console.error("[Admin] Error getting client:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao buscar cliente",
        });
      }
    }),

  /**
   * Delete client credentials
   */
  deleteClient: adminProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      try {
        await adminDb.deleteClientCredentials(input.email);
        return { success: true };
      } catch (error) {
        console.error("[Admin] Error deleting client:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao deletar cliente",
        });
      }
    }),
});
