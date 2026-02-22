/**
 * BLOCK MANUS OAUTH
 * 
 * Bloqueia COMPLETAMENTE qualquer redirecionamento para Manus OAuth
 * Força o app a usar APENAS login nativo do Cocos
 */

(function() {
  'use strict';
  
  console.log('%c[Block Manus OAuth] 🚫 Bloqueando Manus OAuth...', 'color: #ff0000; font-weight: bold; font-size: 14px;');
  
  // 1. Bloquear redirecionamento para Manus
  const originalLocation = window.location;
  
  // Interceptar window.location.href
  Object.defineProperty(window.location, 'href', {
    set: function(value) {
      if (value && (value.includes('manus.im') || value.includes('app-auth') || value.includes('oauth'))) {
        console.warn('[Block Manus OAuth] 🚫 Tentativa de redirecionamento bloqueada:', value);
        return; // Bloquear redirecionamento
      }
      originalLocation.href = value;
    },
    get: function() {
      return originalLocation.href;
    }
  });
  
  // 2. Bloquear window.location.replace
  const originalReplace = window.location.replace;
  window.location.replace = function(url) {
    if (url && (url.includes('manus.im') || url.includes('app-auth') || url.includes('oauth'))) {
      console.warn('[Block Manus OAuth] 🚫 Replace bloqueado:', url);
      return; // Bloquear
    }
    return originalReplace.call(window.location, url);
  };
  
  // 3. Bloquear window.location.assign
  const originalAssign = window.location.assign;
  window.location.assign = function(url) {
    if (url && (url.includes('manus.im') || url.includes('app-auth') || url.includes('oauth'))) {
      console.warn('[Block Manus OAuth] 🚫 Assign bloqueado:', url);
      return; // Bloquear
    }
    return originalAssign.call(window.location, url);
  };
  
  // 4. Bloquear fetch para endpoints OAuth
  const originalFetch = window.fetch;
  window.fetch = function(resource, config) {
    const url = typeof resource === 'string' ? resource : resource.url;
    
    if (url && (url.includes('oauth') || url.includes('manus.im') || url.includes('app-auth'))) {
      console.warn('[Block Manus OAuth] 🚫 Fetch bloqueado:', url);
      return Promise.reject(new Error('OAuth bloqueado'));
    }
    
    return originalFetch.apply(this, arguments);
  };
  
  // 5. Bloquear XMLHttpRequest para OAuth
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
    if (url && (url.includes('oauth') || url.includes('manus.im') || url.includes('app-auth'))) {
      console.warn('[Block Manus OAuth] 🚫 XMLHttpRequest bloqueado:', url);
      throw new Error('OAuth bloqueado');
    }
    return originalOpen.apply(this, arguments);
  };
  
  // 6. Interceptar query parameters com "code" (OAuth callback)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('code') && (urlParams.has('state') || window.location.href.includes('oauth'))) {
    console.warn('[Block Manus OAuth] 🚫 Detectado callback OAuth, limpando URL...');
    window.history.replaceState({}, document.title, window.location.pathname);
  }
  
  // 7. Bloquear qualquer script que tente fazer redirect
  const originalEval = window.eval;
  window.eval = function(code) {
    if (code && (code.includes('manus.im') || code.includes('app-auth') || code.includes('oauth'))) {
      console.warn('[Block Manus OAuth] 🚫 Eval bloqueado');
      return;
    }
    return originalEval.call(this, code);
  };
  
  console.log('%c[Block Manus OAuth] ✅ Bloqueio ativo!', 'color: #00ff00; font-weight: bold; font-size: 14px;');
  console.log('[Block Manus OAuth] Apenas login nativo do Cocos será permitido');
  
})();
