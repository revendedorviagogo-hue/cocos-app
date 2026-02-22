/**
 * ENABLE MODAL SCROLL
 * 
 * Permite scroll dentro dos modais (termos, etc)
 * Remove bloqueios de overflow SEM quebrar scripts de terceiros
 */

(function() {
  'use strict';
  
  console.log('[Enable Modal Scroll] 📜 Ativando scroll em modais...');
  
  // 1. Remover overflow: hidden do body e html
  function enableBodyScroll() {
    try {
      document.documentElement.style.overflow = 'auto';
      document.body.style.overflow = 'auto';
      document.documentElement.style.height = 'auto';
      document.body.style.height = 'auto';
    } catch (e) {
      // Ignorar erros
    }
  }
  
  // 2. MutationObserver para remover overflow:hidden (mais seguro)
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      try {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          const element = mutation.target;
          if (element.style.overflow === 'hidden') {
            element.style.overflow = 'auto';
          }
        }
      } catch (e) {
        // Ignorar erros
      }
    });
  });
  
  // 3. Iniciar observação
  function startObserver() {
    try {
      if (document.body) {
        observer.observe(document.body, {
          attributes: true,
          subtree: true,
          attributeFilter: ['style']
        });
        console.log('[Enable Modal Scroll] MutationObserver ativo');
      } else {
        setTimeout(startObserver, 10);
      }
    } catch (e) {
      // Ignorar erros
    }
  }
  
  // 4. Permitir scroll a cada 500ms (menos frequente)
  setInterval(function() {
    try {
      enableBodyScroll();
      
      // Remover overflow hidden de elementos modais
      const modals = document.querySelectorAll('[role="dialog"], .modal, .bottomSheet, [class*="sheet"]');
      modals.forEach(function(el) {
        try {
          const style = window.getComputedStyle(el);
          if (style.overflow === 'hidden') {
            el.style.overflow = 'auto';
          }
        } catch (e) {
          // Ignorar erros
        }
      });
    } catch (e) {
      // Ignorar erros
    }
  }, 500);
  
  // Iniciar
  enableBodyScroll();
  startObserver();
  
  console.log('[Enable Modal Scroll] ✅ Scroll em modais ativado!');
  
})();
