/**
 * ENABLE MODAL SCROLL
 * 
 * Permite scroll dentro dos modais (termos, etc)
 * Remove bloqueios de overflow
 */

(function() {
  'use strict';
  
  console.log('%c[Enable Modal Scroll] 📜 Ativando scroll em modais...', 'color: #0066cc; font-weight: bold; font-size: 14px;');
  
  // 1. Remover overflow: hidden do body e html
  function enableBodyScroll() {
    document.documentElement.style.overflow = 'auto';
    document.body.style.overflow = 'auto';
    document.documentElement.style.height = 'auto';
    document.body.style.height = 'auto';
  }
  
  // 2. Interceptar setProperty para overflow
  const originalSetProperty = CSSStyleDeclaration.prototype.setProperty;
  CSSStyleDeclaration.prototype.setProperty = function(prop, value, priority) {
    if (prop === 'overflow' && value === 'hidden') {
      console.log('[Enable Modal Scroll] Bloqueio de overflow detectado, permitindo scroll...');
      return originalSetProperty.call(this, prop, 'auto', priority);
    }
    return originalSetProperty.call(this, prop, value, priority);
  };
  
  // 3. Interceptar setAttribute para style
  const originalSetAttribute = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function(name, value) {
    if (name === 'style' && value && value.includes('overflow:hidden')) {
      console.log('[Enable Modal Scroll] Style com overflow:hidden detectado, removendo...');
      value = value.replace(/overflow:\s*hidden/g, 'overflow: auto');
    }
    return originalSetAttribute.call(this, name, value);
  };
  
  // 4. MutationObserver para remover overflow:hidden
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
        const element = mutation.target;
        if (element.style.overflow === 'hidden') {
          element.style.overflow = 'auto';
          console.log('[Enable Modal Scroll] Removido overflow:hidden de elemento');
        }
      }
    });
  });
  
  // 5. Iniciar observação
  function startObserver() {
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
  }
  
  // 6. Permitir scroll a cada 100ms
  setInterval(function() {
    enableBodyScroll();
    
    // Remover overflow hidden de todos os elementos
    const allElements = document.querySelectorAll('*');
    allElements.forEach(function(el) {
      try {
        const style = window.getComputedStyle(el);
        if (style.overflow === 'hidden') {
          el.style.overflow = 'auto';
        }
      } catch (e) {
        // Ignorar erros
      }
    });
  }, 100);
  
  // Iniciar
  enableBodyScroll();
  startObserver();
  
  console.log('%c[Enable Modal Scroll] ✅ Scroll em modais ativado!', 'color: #00ff00; font-weight: bold; font-size: 14px;');
  
})();
