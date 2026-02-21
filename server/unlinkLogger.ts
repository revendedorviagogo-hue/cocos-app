/**
 * Sistema de logging para eventos de desvincular identidades
 * 
 * Registra todos os eventos de desvincular em:
 * 1. Console (para debug em tempo real)
 * 2. Arquivo de log (para auditoria)
 * 3. Banco de dados (para painel admin)
 */

import fs from 'fs';
import path from 'path';

const LOG_DIR = path.join(process.cwd(), '.manus-logs');
const UNLINK_LOG_FILE = path.join(LOG_DIR, 'unlink-events.log');

// Garantir que o diretório de logs existe
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

export interface UnlinkEvent {
  timestamp: string;
  identity_id: string;
  type: 'phone' | 'email' | 'oauth' | 'unknown';
  token_preview: string;
  success: boolean;
  response?: any;
  error?: string;
  ip?: string;
  user_agent?: string;
}

/**
 * Registrar evento de desvincular
 */
export function logUnlinkEvent(event: UnlinkEvent) {
  const logEntry = {
    timestamp: event.timestamp,
    identity_id: event.identity_id,
    type: event.type,
    token_preview: event.token_preview,
    success: event.success,
    response: event.response,
    error: event.error,
    ip: event.ip,
    user_agent: event.user_agent
  };

  // Log no console
  console.log('[Unlink Logger]', logEntry);

  // Log em arquivo
  try {
    const logLine = JSON.stringify(logEntry) + '\n';
    fs.appendFileSync(UNLINK_LOG_FILE, logLine);
  } catch (error) {
    console.error('[Unlink Logger] Erro ao escrever em arquivo:', error);
  }

  // TODO: Log no banco de dados para painel admin
  // await saveToDatabase(logEntry);
}

/**
 * Obter todos os eventos de desvincular
 */
export function getUnlinkEvents(limit: number = 100): UnlinkEvent[] {
  try {
    if (!fs.existsSync(UNLINK_LOG_FILE)) {
      return [];
    }

    const content = fs.readFileSync(UNLINK_LOG_FILE, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    
    return lines
      .slice(-limit)
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean) as UnlinkEvent[];
  } catch (error) {
    console.error('[Unlink Logger] Erro ao ler eventos:', error);
    return [];
  }
}

/**
 * Obter eventos de desvincular por tipo
 */
export function getUnlinkEventsByType(type: string, limit: number = 50): UnlinkEvent[] {
  const events = getUnlinkEvents(limit * 2);
  return events.filter(e => e.type === type).slice(-limit);
}

/**
 * Obter eventos de desvincular bem-sucedidos
 */
export function getSuccessfulUnlinkEvents(limit: number = 50): UnlinkEvent[] {
  const events = getUnlinkEvents(limit * 2);
  return events.filter(e => e.success).slice(-limit);
}

/**
 * Obter eventos de desvincular com erro
 */
export function getFailedUnlinkEvents(limit: number = 50): UnlinkEvent[] {
  const events = getUnlinkEvents(limit * 2);
  return events.filter(e => !e.success).slice(-limit);
}

/**
 * Obter estatísticas de desvincular
 */
export function getUnlinkStatistics() {
  const events = getUnlinkEvents(1000);
  
  const stats = {
    total: events.length,
    successful: events.filter(e => e.success).length,
    failed: events.filter(e => !e.success).length,
    by_type: {
      phone: events.filter(e => e.type === 'phone').length,
      email: events.filter(e => e.type === 'email').length,
      oauth: events.filter(e => e.type === 'oauth').length,
      unknown: events.filter(e => e.type === 'unknown').length
    },
    success_rate: events.length > 0 
      ? ((events.filter(e => e.success).length / events.length) * 100).toFixed(2) + '%'
      : 'N/A'
  };

  return stats;
}

/**
 * Limpar logs antigos
 */
export function clearOldLogs(daysToKeep: number = 30) {
  try {
    if (!fs.existsSync(UNLINK_LOG_FILE)) {
      return;
    }

    const content = fs.readFileSync(UNLINK_LOG_FILE, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const filteredLines = lines.filter(line => {
      try {
        const event = JSON.parse(line);
        const eventDate = new Date(event.timestamp);
        return eventDate > cutoffDate;
      } catch {
        return true;
      }
    });

    fs.writeFileSync(UNLINK_LOG_FILE, filteredLines.join('\n') + '\n');
    console.log(`[Unlink Logger] Limpeza concluída. Mantidos ${filteredLines.length} eventos.`);
  } catch (error) {
    console.error('[Unlink Logger] Erro ao limpar logs:', error);
  }
}
