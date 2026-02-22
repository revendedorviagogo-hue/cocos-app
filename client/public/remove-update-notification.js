/**
 * REMOVE UPDATE NOTIFICATION - VERSÃO SEGURA
 * 
 * Remove COMPLETAMENTE a mensagem de atualização com validações seguras
 * SEM quebrar scripts de terceiros como Google Tag Manager
 */

(function() {
  'use strict';
  
  console.log('[Remove Update] Sistema ativo!');
  
  // Função segura para verificar texto
  function isSuspiciousText(node) {
    try {
      if (!node || !node.textContent) return false;
      const text = String(node.textContent).toLowerCase();
      return text.includes('actualización') || 
             text.includes('actualizar') ||
             text.includes('atención');
    } catch (e) {
      return false;
    }
  }
  
  // Função segura para verificar classe
  function isSuspiciousClass(node) {
    try {
      if (!node || !node.className) return false;
      const className = String(node.className);
      return className.includes('backgroundContainer') ||
             className.includes('bottomSheet') ||
             className.includes('contentWrapper');
    } catch (e) {
      return false;
    }
  }
  
  // MutationObserver como backup (mais seguro que interceptar métodos)
  const observer = new MutationObserver(function(mutations) {
    try {
      mutations.forEach(function(mutation) {
        try {
          if (mutation.addedNodes) {
            mutation.addedNodes.forEach(function(node) {
              try {
                if (node.nodeType === 1 && (isSuspiciousText(node) || isSuspiciousClass(node))) {
                  console.log('[Remove Update] MutationObserver removendo modal!');
                  node.remove();
                }
              } catch (e) {
                // Ignorar erros individuais
              }
            });
          }
        } catch (e) {
          // Ignorar erros de mutação
        }
      });
    } catch (e) {
      console.warn('[Remove Update] Erro em MutationObserver:', e.message);
    }
  });
  
  // Iniciar observação assim que o body existir
  function startObserver() {
    try {
      if (document.body) {
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
        console.log('[Remove Update] MutationObserver ativo!');
      } else {
        setTimeout(startObserver, 10);
      }
    } catch (e) {
      console.warn('[Remove Update] Erro ao iniciar observer:', e.message);
    }
  }
  startObserver();
  
  // Remoção agressiva a cada 500ms (menos frequente para não impactar performance)
  setInterval(function() {
    try {
      const elements = document.querySelectorAll('*');
      elements.forEach(function(el) {
        try {
          if (el && el.textContent && (isSuspiciousText(el) || isSuspiciousClass(el))) {
            let parent = el;
            while (parent && parent.parentElement && parent.parentElement !== document.body) {
              parent = parent.parentElement;
            }
            if (parent && parent.parentElement) {
              parent.remove();
              console.log('[Remove Update] Removido por varredura!');
            }
          }
        } catch (e) {
          // Ignorar erros individuais
        }
      });
    } catch (e) {
      console.warn('[Remove Update] Erro na varredura:', e.message);
    }
  }, 500);
  
  console.log('[Remove Update] Sistema ativo - usando apenas MutationObserver!');
})();
