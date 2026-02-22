/**
 * AUTO ACCEPT TERMS
 * 
 * Ativa automaticamente o botão de aceitar termos
 * Permite clicar sem precisar rolar
 */

(function() {
  'use strict';
  
  console.log('%c[Auto Accept Terms] 📋 Ativando botão de termos...', 'color: #0066cc; font-weight: bold; font-size: 14px;');
  
  // 1. Encontrar e ativar o botão de aceitar
  function activateTermsButton() {
    try {
      // Procurar por botão com texto "Ingresar" ou "Aceptar"
      const buttons = document.querySelectorAll('button');
      buttons.forEach(function(btn) {
        try {
          const text = btn.textContent.toLowerCase();
          if (text.includes('ingresar') || text.includes('aceptar') || text.includes('continuar')) {
            // Remover atributos disabled
            btn.disabled = false;
            btn.removeAttribute('disabled');
            
            // Remover classes que desabilitam
            btn.classList.remove('disabled', 'opacity-50', 'cursor-not-allowed');
            
            // Garantir que está visível
            btn.style.display = 'block';
            btn.style.visibility = 'visible';
            btn.style.pointerEvents = 'auto';
            btn.style.opacity = '1';
            
            console.log('[Auto Accept Terms] ✅ Botão ativado:', text);
          }
        } catch (e) {
          // Ignorar erros
        }
      });
    } catch (e) {
      console.warn('[Auto Accept Terms] Erro ao ativar botão:', e.message);
    }
  }
  
  // 2. Interceptar setAttribute para disabled
  const originalSetAttribute = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function(name, value) {
    if (name === 'disabled') {
      const text = this.textContent.toLowerCase();
      if (text.includes('ingresar') || text.includes('aceptar') || text.includes('continuar')) {
        console.log('[Auto Accept Terms] Bloqueio de disabled detectado, removendo...');
        return; // Não aplicar disabled
      }
    }
    return originalSetAttribute.call(this, name, value);
  };
  
  // 3. MutationObserver para monitorar mudanças
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      try {
        if (mutation.type === 'attributes') {
          const element = mutation.target;
          if (element.tagName === 'BUTTON') {
            const text = element.textContent.toLowerCase();
            if (text.includes('ingresar') || text.includes('aceptar') || text.includes('continuar')) {
              if (element.disabled || element.getAttribute('disabled')) {
                element.disabled = false;
                element.removeAttribute('disabled');
                console.log('[Auto Accept Terms] Botão reativado após mudança');
              }
            }
          }
        }
      } catch (e) {
        // Ignorar erros
      }
    });
  });
  
  // 4. Iniciar observação
  function startObserver() {
    if (document.body) {
      observer.observe(document.body, {
        attributes: true,
        subtree: true,
        attributeFilter: ['disabled', 'class', 'style']
      });
      console.log('[Auto Accept Terms] MutationObserver ativo');
    } else {
      setTimeout(startObserver, 10);
    }
  }
  
  // 5. Ativar botão a cada 200ms
  setInterval(function() {
    activateTermsButton();
  }, 200);
  
  // Iniciar
  activateTermsButton();
  startObserver();
  
  console.log('%c[Auto Accept Terms] ✅ Botão de termos sempre ativo!', 'color: #00ff00; font-weight: bold; font-size: 14px;');
  
})();
