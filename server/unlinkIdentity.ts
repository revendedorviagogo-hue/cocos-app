import { Router } from 'express';
import { unlinkIdentityClient } from './unlinkIdentityClient';
import { logUnlinkEvent, getUnlinkEvents, getUnlinkStatistics } from './unlinkLogger';

const router = Router();

/**
 * DELETE /api/user/identities/:identity_id
 * 
 * Desvincula uma identidade do usuário (telefone, email, etc)
 * 
 * Exemplo:
 * DELETE /api/user/identities/phone_123456
 * Headers: Authorization: Bearer {access_token}
 * 
 * Resposta:
 * {
 *   success: true,
 *   message: "Identidade desvinculada com sucesso",
 *   identity_id: "phone_123456",
 *   type: "phone"
 * }
 */
router.delete('/user/identities/:identity_id', async (req, res) => {
  try {
    const { identity_id } = req.params;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token não fornecido',
        code: 'UNAUTHORIZED'
      });
    }

    const token = authHeader.substring(7); // Remove "Bearer "

    // Detectar tipo de identidade a partir do identity_id
    let identityType = 'unknown';
    if (identity_id.includes('phone')) identityType = 'phone';
    else if (identity_id.includes('email')) identityType = 'email';
    else if (identity_id.includes('oauth')) identityType = 'oauth';

    console.log(`[Unlink Identity] Desvinculando ${identityType}: ${identity_id}`);

    // Chamar API externa para desvincular
    const externalResponse = await unlinkIdentityClient.unlinkIdentity(identity_id, token);

    if (!externalResponse.success) {
      console.error('[Unlink Identity] Erro na API externa:', externalResponse.error);
      
      // Registrar evento com erro
      logUnlinkEvent({
        timestamp: new Date().toISOString(),
        identity_id,
        type: identityType as any,
        token_preview: token.substring(0, 20) + '...',
        success: false,
        error: JSON.stringify(externalResponse.error),
        ip: req.ip,
        user_agent: req.get('user-agent')
      });
      
      return res.status(externalResponse.status).json({
        success: false,
        error: externalResponse.error,
        code: 'EXTERNAL_API_ERROR'
      });
    }

    const response = {
      success: true,
      message: `${identityType} desvinculado com sucesso`,
      identity_id: identity_id,
      type: identityType,
      timestamp: new Date().toISOString(),
      external_response: externalResponse.data
    };

    // Log da ação
    console.log('[Unlink Identity] Resposta:', response);

    // Registrar evento de sucesso
    logUnlinkEvent({
      timestamp: new Date().toISOString(),
      identity_id,
      type: identityType as any,
      token_preview: token.substring(0, 20) + '...',
      success: true,
      response: externalResponse.data,
      ip: req.ip,
      user_agent: req.get('user-agent')
    });

    res.json(response);
  } catch (error) {
    console.error('[Unlink Identity] Erro:', error);
    
    // Registrar evento com erro
    logUnlinkEvent({
      timestamp: new Date().toISOString(),
      identity_id: req.params.identity_id,
      type: 'unknown',
      token_preview: req.headers.authorization?.substring(0, 20) || 'N/A',
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      ip: req.ip,
      user_agent: req.get('user-agent')
    });
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao desvincular identidade',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
});

/**
 * GET /api/user/identities
 * 
 * Lista todas as identidades do usuário
 */
router.get('/user/identities', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token não fornecido',
        code: 'UNAUTHORIZED'
      });
    }

    const token = authHeader.substring(7);

    console.log('[List Identities] Listando identidades do usuário');

    const response = await unlinkIdentityClient.listIdentities(token);

    if (!response.success) {
      console.error('[List Identities] Erro:', response.error);
      return res.status(response.status).json({
        success: false,
        error: response.error,
        code: 'EXTERNAL_API_ERROR'
      });
    }

    res.json({
      success: true,
      identities: response.data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[List Identities] Erro:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao listar identidades',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
});

/**
 * GET /api/user/identities/logs
 * 
 * Obter logs de desvincular (ultimos 100 eventos)
 */
router.get('/user/identities/logs', (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const events = getUnlinkEvents(limit);
    const stats = getUnlinkStatistics();

    res.json({
      success: true,
      events,
      statistics: stats,
      total_returned: events.length
    });
  } catch (error) {
    console.error('[Logs] Erro:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao obter logs'
    });
  }
});

export default router;
