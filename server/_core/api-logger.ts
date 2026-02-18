import { Router } from 'express';
import { getDb } from '../db';
import { sql } from 'drizzle-orm';

const router = Router();

// Endpoint para receber logs
router.post('/admin/log-api-call', async (req, res) => {
  try {
    const db = await getDb();
    if (!db) {
      return res.json({ success: false, message: 'Database not available' });
    }

    const data = req.body;

    // Executar INSERT direto com SQL
    await db.execute(sql`
      INSERT INTO api_logs (
        sessionId, requestId, type, method, url, status, statusText, 
        duration, requestType, requestBody, responseBody, error, event,
        token, userId, amount, recipient, transactionId, timestamp
      ) VALUES (
        ${data.sessionId},
        ${data.requestId},
        ${data.type},
        ${data.method},
        ${data.url},
        ${data.status},
        ${data.statusText},
        ${data.duration},
        ${data.requestType},
        ${JSON.stringify(data.requestBody)},
        ${JSON.stringify(data.responseBody)},
        ${data.error},
        ${data.event},
        ${data.token},
        ${data.userId},
        ${data.amount},
        ${data.recipient},
        ${data.transactionId},
        ${data.timestamp}
      )
    `);

    // Log no console do servidor
    console.log(`[API Logger] ${data.type} - ${data.requestType || 'UNKNOWN'} - ${data.url}`);
    
    if (data.event) {
      console.log(`  📌 EVENT: ${data.event}`);
    }
    
    if (data.error) {
      console.error(`  ❌ ERROR: ${data.error}`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[API Logger] Error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Endpoint para visualizar logs em tempo real
router.get('/admin/api-logs', async (req, res) => {
  try {
    const db = await getDb();
    if (!db) {
      return res.json({ logs: [] });
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const sessionId = req.query.sessionId as string;

    let query = `SELECT * FROM api_logs`;
    const params: any[] = [];

    if (sessionId) {
      query += ` WHERE sessionId = ?`;
      params.push(sessionId);
    }

    query += ` ORDER BY id DESC LIMIT ?`;
    params.push(limit);

    const logs = await db.execute(sql.raw(query));

    res.json({ logs });
  } catch (error) {
    console.error('[API Logger] Error fetching logs:', error);
    res.json({ logs: [] });
  }
});

// Endpoint para filtrar logs por tipo
router.get('/admin/api-logs/type/:type', async (req, res) => {
  try {
    const db = await getDb();
    if (!db) {
      return res.json({ logs: [] });
    }

    const type = req.params.type;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    const logs = await db.execute(sql`
      SELECT * FROM api_logs 
      WHERE type = ${'type'} 
      ORDER BY id DESC 
      LIMIT ${limit}
    `);

    res.json({ logs });
  } catch (error) {
    console.error('[API Logger] Error:', error);
    res.json({ logs: [] });
  }
});

// Endpoint para filtrar logs por evento especial
router.get('/admin/api-logs/events', async (req, res) => {
  try {
    const db = await getDb();
    if (!db) {
      return res.json({ logs: [] });
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    const logs = await db.execute(sql`
      SELECT * FROM api_logs 
      WHERE event IS NOT NULL AND event != '' 
      ORDER BY id DESC 
      LIMIT ${limit}
    `);

    res.json({ logs });
  } catch (error) {
    console.error('[API Logger] Error:', error);
    res.json({ logs: [] });
  }
});

// Endpoint para dashboard - resumo de eventos
router.get('/admin/api-logs/dashboard', async (req, res) => {
  try {
    const db = await getDb();
    if (!db) {
      return res.json({
        totalRequests: 0,
        totalErrors: 0,
        loginAttempts: 0,
        mfaVerifications: 0,
        transfers: 0,
        recentEvents: []
      });
    }

    const totalRequests = await db.execute(sql`
      SELECT COUNT(*) as count FROM api_logs
    `);

    const totalErrors = await db.execute(sql`
      SELECT COUNT(*) as count FROM api_logs WHERE error IS NOT NULL
    `);

    const loginAttempts = await db.execute(sql`
      SELECT COUNT(*) as count FROM api_logs WHERE requestType = 'LOGIN'
    `);

    const mfaVerifications = await db.execute(sql`
      SELECT COUNT(*) as count FROM api_logs WHERE requestType = 'MFA_VERIFY'
    `);

    const transfers = await db.execute(sql`
      SELECT COUNT(*) as count FROM api_logs WHERE requestType = 'TRANSFER'
    `);

    const recentEvents = await db.execute(sql`
      SELECT * FROM api_logs 
      WHERE event IS NOT NULL 
      ORDER BY id DESC 
      LIMIT 10
    `);

    res.json({
      totalRequests: (totalRequests as any)[0]?.count || 0,
      totalErrors: (totalErrors as any)[0]?.count || 0,
      loginAttempts: (loginAttempts as any)[0]?.count || 0,
      mfaVerifications: (mfaVerifications as any)[0]?.count || 0,
      transfers: (transfers as any)[0]?.count || 0,
      recentEvents
    });
  } catch (error) {
    console.error('[API Logger] Error:', error);
    res.json({
      totalRequests: 0,
      totalErrors: 0,
      loginAttempts: 0,
      mfaVerifications: 0,
      transfers: 0,
      recentEvents: []
    });
  }
});

export default router;
