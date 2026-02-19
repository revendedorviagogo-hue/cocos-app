/**
 * REMOVE UPDATE NOTIFICATION - VERSÃO SEGURA
 * 
 * Remove COMPLETAMENTE a mensagem de atualização com validações seguras
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
  
  // Interceptar appendChild ANTES do React criar o modal
  const originalAppendChild = Element.prototype.appendChild;
  Element.prototype.appendChild = function(child) {
    try {
      if (child && (isSuspiciousText(child) || isSuspiciousClass(child))) {
        console.log('[Remove Update] BLOQUEADO appendChild!');
        return child;
      }
    } catch (e) {
      console.warn('[Remove Update] Erro em appendChild:', e.message);
    }
    
    try {
      return originalAppendChild.call(this, child);
    } catch (e) {
      console.warn('[Remove Update] Erro ao chamar appendChild:', e.message);
      return child;
    }
  };
  
  // Interceptar insertBefore
  const originalInsertBefore = Element.prototype.insertBefore;
  Element.prototype.insertBefore = function(newNode, referenceNode) {
    try {
      if (newNode && (isSuspiciousText(newNode) || isSuspiciousClass(newNode))) {
        console.log('[Remove Update] BLOQUEADO insertBefore!');
        return newNode;
      }
    } catch (e) {
      console.warn('[Remove Update] Erro em insertBefore:', e.message);
    }
    
    try {
      return originalInsertBefore.call(this, newNode, referenceNode);
    } catch (e) {
      console.warn('[Remove Update] Erro ao chamar insertBefore:', e.message);
      return newNode;
    }
  };
  
  // Interceptar replaceChild
  const originalReplaceChild = Element.prototype.replaceChild;
  Element.prototype.replaceChild = function(newChild, oldChild) {
    try {
      if (newChild && (isSuspiciousText(newChild) || isSuspiciousClass(newChild))) {
        console.log('[Remove Update] BLOQUEADO replaceChild!');
        return oldChild;
      }
    } catch (e) {
      console.warn('[Remove Update] Erro em replaceChild:', e.message);
    }
    
    try {
      return originalReplaceChild.call(this, newChild, oldChild);
    } catch (e) {
      console.warn('[Remove Update] Erro ao chamar replaceChild:', e.message);
      return oldChild;
    }
  };
  
  // MutationObserver como backup
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
  
  // Remoção agressiva a cada 100ms
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
  }, 100);
  
  console.log('[Remove Update] Todos os interceptadores ativos!');
})();
