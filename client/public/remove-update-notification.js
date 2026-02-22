/**
 * REMOVE UPDATE NOTIFICATION - VERSÃO ULTRA-AGRESSIVA
 * 
 * Remove COMPLETAMENTE a mensagem de atualização interceptando
 * a criação do DOM ANTES do React renderizar.
 */

(function() {
  'use strict';
  
  console.log('[Remove Update] Sistema ultra-agressivo ativo!');
  
  // Interceptar appendChild ANTES do React criar o modal
  const originalAppendChild = Element.prototype.appendChild;
  Element.prototype.appendChild = function(child) {
    // Verificar se é o modal de atualização
    if (child && child.textContent) {
      const text = child.textContent.toLowerCase();
      if (text.includes('actualización') || 
          text.includes('actualizar') ||
          text.includes('atención')) {
        console.log('[Remove Update] BLOQUEADO appendChild de modal!');
        return child; // Retorna mas não adiciona
      }
    }
    
    // Verificar classes suspeitas
    if (child && child.className) {
      const className = child.className.toString();
      if (className.includes('backgroundContainer') ||
          className.includes('bottomSheet') ||
          className.includes('contentWrapper')) {
        console.log('[Remove Update] BLOQUEADO appendChild por classe:', className);
        return child;
      }
    }
    
    return originalAppendChild.call(this, child);
  };
  
  // Interceptar insertBefore
  const originalInsertBefore = Element.prototype.insertBefore;
  Element.prototype.insertBefore = function(newNode, referenceNode) {
    if (newNode && newNode.textContent) {
      const text = newNode.textContent.toLowerCase();
      if (text.includes('actualización') || 
          text.includes('actualizar') ||
          text.includes('atención')) {
        console.log('[Remove Update] BLOQUEADO insertBefore de modal!');
        return newNode;
      }
    }
    
    if (newNode && newNode.className) {
      const className = newNode.className.toString();
      if (className.includes('backgroundContainer') ||
          className.includes('bottomSheet')) {
        console.log('[Remove Update] BLOQUEADO insertBefore por classe:', className);
        return newNode;
      }
    }
    
    return originalInsertBefore.call(this, newNode, referenceNode);
  };
  
  // Interceptar replaceChild
  const originalReplaceChild = Element.prototype.replaceChild;
  Element.prototype.replaceChild = function(newChild, oldChild) {
    if (newChild && newChild.textContent) {
      const text = newChild.textContent.toLowerCase();
      if (text.includes('actualización') || text.includes('actualizar')) {
        console.log('[Remove Update] BLOQUEADO replaceChild!');
        return oldChild;
      }
    }
    return originalReplaceChild.call(this, newChild, oldChild);
  };
  
  // MutationObserver como backup
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      mutation.addedNodes.forEach(function(node) {
        if (node.nodeType === 1) { // Element node
          const text = node.textContent || '';
          const className = node.className || '';
          
          if (text.toLowerCase().includes('actualización') ||
              text.toLowerCase().includes('actualizar') ||
              className.toString().includes('backgroundContainer') ||
              className.toString().includes('bottomSheet')) {
            console.log('[Remove Update] MutationObserver removendo modal!');
            node.remove();
          }
        }
      });
    });
  });
  
  // Iniciar observação assim que o body existir
  function startObserver() {
    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      console.log('[Remove Update] MutationObserver ativo!');
    } else {
      setTimeout(startObserver, 10);
    }
  }
  startObserver();
  
  // Remoção agressiva a cada 100ms
  setInterval(function() {
    const elements = document.querySelectorAll('*');
    elements.forEach(function(el) {
      const text = el.textContent || '';
      const className = el.className || '';
      
      if (text.toLowerCase().includes('hay una actualización') ||
          className.toString().includes('backgroundContainer') ||
          className.toString().includes('bottomSheet')) {
        // Remover o elemento pai mais alto
        let parent = el;
        while (parent.parentElement && parent.parentElement !== document.body) {
          parent = parent.parentElement;
        }
        if (parent && parent.parentElement) {
          parent.remove();
          console.log('[Remove Update] Removido por varredura!');
        }
      }
    });
  }, 100);
  
  // Bloquear Service Worker que pode estar mostrando a notificação
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      registrations.forEach(function(registration) {
        console.log('[Remove Update] Service Worker encontrado, verificando...');
        // Não desregistrar, apenas interceptar mensagens
      });
    });
  }
  
  console.log('[Remove Update] Todos os interceptadores ativos!');
})();
