/**
 * FORCE MOBILE VIEWPORT
 * 
 * Força o app a sempre aparecer com viewport mobile
 * Mesmo quando aberto em desktop/navegador
 */

(function() {
  'use strict';
  
  console.log('%c[Force Mobile Viewport] 📱 Forçando viewport mobile...', 'color: #0066cc; font-weight: bold; font-size: 14px;');
  
  // 1. Atualizar viewport meta tag
  let viewportMeta = document.querySelector('meta[name="viewport"]');
  if (!viewportMeta) {
    viewportMeta = document.createElement('meta');
    viewportMeta.name = 'viewport';
    document.head.appendChild(viewportMeta);
  }
  
  viewportMeta.setAttribute('content', 
    'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
  );
  
  console.log('[Force Mobile Viewport] ✅ Viewport meta tag atualizado');
  
  // 2. Forçar dimensões de mobile
  function forceMobileSize() {
    const style = document.createElement('style');
    style.textContent = `
      /* Forçar dimensões mobile */
      html, body {
        width: 100vw;
        height: 100vh;
        max-width: 100%;
        overflow: hidden;
      }
      
      /* Remover barras de scroll */
      ::-webkit-scrollbar {
        display: none;
      }
      
      * {
        -webkit-user-select: none;
        -webkit-touch-callout: none;
      }
      
      /* Forçar app a ocupar tela inteira */
      #root {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
      }
      
      /* Remover zoom em inputs */
      input, textarea, select {
        font-size: 16px !important;
      }
      
      /* Prevenir bounce scroll em iOS */
      body {
        overscroll-behavior: none;
      }
    `;
    document.head.appendChild(style);
  }
  
  // 3. Override de window.innerWidth/innerHeight para simular mobile
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;
  
  // Simular dimensões de mobile (375x667 = iPhone SE)
  const mobileWidth = Math.min(375, originalInnerWidth);
  const mobileHeight = Math.min(667, originalInnerHeight);
  
  Object.defineProperty(window, 'innerWidth', {
    get: function() {
      return mobileWidth;
    },
    configurable: true
  });
  
  Object.defineProperty(window, 'innerHeight', {
    get: function() {
      return mobileHeight;
    },
    configurable: true
  });
  
  // 4. Override de screen.width/height
  Object.defineProperty(screen, 'width', {
    get: function() {
      return mobileWidth;
    },
    configurable: true
  });
  
  Object.defineProperty(screen, 'height', {
    get: function() {
      return mobileHeight;
    },
    configurable: true
  });
  
  // 5. Forçar devicePixelRatio para mobile
  Object.defineProperty(window, 'devicePixelRatio', {
    get: function() {
      return 2; // Retina display
    },
    configurable: true
  });
  
  // 6. Interceptar matchMedia para simular mobile
  const originalMatchMedia = window.matchMedia;
  window.matchMedia = function(query) {
    // Simular que é sempre mobile
    if (query.includes('max-width') || query.includes('mobile') || query.includes('portrait')) {
      return {
        matches: true,
        media: query,
        onchange: null,
        addListener: function() {},
        removeListener: function() {},
        addEventListener: function() {},
        removeEventListener: function() {},
        dispatchEvent: function() {}
      };
    }
    
    if (query.includes('min-width') && query.includes('768')) {
      return {
        matches: false,
        media: query,
        onchange: null,
        addListener: function() {},
        removeListener: function() {},
        addEventListener: function() {},
        removeEventListener: function() {},
        dispatchEvent: function() {}
      };
    }
    
    return originalMatchMedia.call(this, query);
  };
  
  // 7. Aplicar estilos
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', forceMobileSize);
  } else {
    forceMobileSize();
  }
  
  console.log('[Force Mobile Viewport] ✅ Viewport mobile forçado!');
  console.log('[Force Mobile Viewport] Dimensões simuladas:', {
    width: mobileWidth,
    height: mobileHeight,
    dpr: 2
  });
  
  // 8. Disparar evento de resize para aplicações que escutam
  setTimeout(() => {
    window.dispatchEvent(new Event('resize'));
    window.dispatchEvent(new Event('orientationchange'));
    console.log('[Force Mobile Viewport] ✅ Eventos de resize/orientationchange disparados');
  }, 100);
  
})();
