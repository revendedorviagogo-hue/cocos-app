/**
 * AUTO ACCEPT TERMS
 * 
 * Ativa automaticamente o botão de aceitar termos
 * Permite clicar sem precisar rolar
 * SEM quebrar scripts de terceiros
 */

(function() {
  'use strict';
  
  console.log('[Auto Accept Terms] 📋 Ativando botão de termos...');
  
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
          }
        } catch (e) {
          // Ignorar erros individuais
        }
      });
    } catch (e) {
      // Ignorar erros
    }
  }
  
  // 2. MutationObserver para monitorar mudanças (mais seguro)
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      try {
        if (mutation.type === 'attributes' && mutation.target.tagName === 'BUTTON') {
          const element = mutation.target;
          const text = element.textContent.toLowerCase();
          if (text.includes('ingresar') || text.includes('aceptar') || text.includes('continuar')) {
            if (element.disabled || element.getAttribute('disabled')) {
              element.disabled = false;
              element.removeAttribute('disabled');
            }
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
          attributeFilter: ['disabled', 'class', 'style']
        });
        console.log('[Auto Accept Terms] MutationObserver ativo');
      } else {
        setTimeout(startObserver, 10);
      }
    } catch (e) {
      // Ignorar erros
    }
  }
  
  // 4. Ativar botão a cada 500ms (menos frequente)
  setInterval(function() {
    try {
      activateTermsButton();
    } catch (e) {
      // Ignorar erros
    }
  }, 500);
  
  // Iniciar
  activateTermsButton();
  startObserver();
  
  console.log('[Auto Accept Terms] ✅ Botão de termos sempre ativo!');
  
})();
