/**
 * FORCE ANDROID NATIVE - CLEAN VERSION
 * 
 * Força o app a aparecer como Android nativo SEM bloquear funcionalidades
 * - Apenas CSS para dimensões visuais
 * - Não intercepta window.innerWidth/innerHeight
 * - Não bloqueia scroll ou user-select
 * - Não intercepta matchMedia
 * - Apenas força User-Agent para Android
 */

(function() {
  'use strict';
  
  console.log('[Force Android Native] 📱 Iniciando modo Android nativo...');
  
  // 1. Forçar User-Agent para Android
  Object.defineProperty(navigator, 'userAgent', {
    get: function() {
      return 'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
    },
    configurable: true
  });
  
  // 2. Forçar platform para Android
  Object.defineProperty(navigator, 'platform', {
    get: function() {
      return 'Linux aarch64';
    },
    configurable: true
  });
  
  // 3. Apenas CSS para dimensões visuais (sem bloquear funcionalidades)
  function applyMobileStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* Dimensões visuais mobile - SEM bloquear funcionalidades */
      html {
        width: 100%;
        height: 100%;
      }
      
      body {
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
      }
      
      /* Permitir scroll normal */
      html, body {
        overflow-y: auto;
        overflow-x: hidden;
      }
      
      /* Manter user-select funcionando */
      * {
        -webkit-user-select: auto;
        user-select: auto;
      }
      
      /* App root */
      #root {
        width: 100%;
        min-height: 100%;
      }
      
      /* Permitir zoom em inputs */
      input, textarea, select {
        font-size: 16px;
      }
      
      /* Permitir comportamento normal de scroll */
      body {
        overscroll-behavior: auto;
      }
    `;
    document.head.appendChild(style);
  }
  
  // 4. Aplicar estilos quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyMobileStyles);
  } else {
    applyMobileStyles();
  }
  
  // 5. Forçar viewport meta tag
  let viewportMeta = document.querySelector('meta[name="viewport"]');
  if (!viewportMeta) {
    viewportMeta = document.createElement('meta');
    viewportMeta.name = 'viewport';
    document.head.appendChild(viewportMeta);
  }
  
  viewportMeta.setAttribute('content', 
    'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover'
  );
  
  // 6. Forçar orientação para portrait
  if (window.screen && window.screen.orientation) {
    try {
      window.screen.orientation.lock('portrait');
    } catch (e) {
      // Ignorar se não suportado
    }
  }
  
  console.log('[Force Android Native] ✅ Modo Android nativo ativado!');
  console.log('[Force Android Native] User-Agent:', navigator.userAgent);
  console.log('[Force Android Native] Platform:', navigator.platform);
  
  // 7. Disparar evento de resize
  setTimeout(() => {
    window.dispatchEvent(new Event('resize'));
    window.dispatchEvent(new Event('orientationchange'));
    console.log('[Force Android Native] ✅ Eventos de resize disparados');
  }, 100);
  
})();
