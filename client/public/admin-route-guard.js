/**
 * ADMIN ROUTE GUARD
 * 
 * Bloqueia o carregamento do app Cocos original nas rotas /admin/*
 * para permitir que o painel administrativo funcione corretamente
 */

(function() {
  'use strict';
  
  // Verificar se estamos em uma rota admin
  const isAdminRoute = window.location.pathname.startsWith('/admin');
  
  if (isAdminRoute) {
    console.log('[Admin Route Guard] Rota administrativa detectada - bloqueando app Cocos');
    
    // BLOQUEAR COMPLETAMENTE O APP COCOS
    // Criar um stub que impede a execução do bundle Cocos
    window.__COCOS_BLOCKED__ = true;
    
    // Interceptar e bloquear TODOS os scripts
    const originalAppendChild = Node.prototype.appendChild;
    Node.prototype.appendChild = function(child) {
      if (child.tagName === 'SCRIPT' && child.src && child.src.includes('/assets/index-')) {
        console.log('[Admin Route Guard] BLOQUEADO script Cocos:', child.src);
        return child; // Retornar sem adicionar
      }
      return originalAppendChild.call(this, child);
    };
    
    // Limpar o root imediatamente
    const root = document.getElementById('root');
    if (root) {
      root.innerHTML = ''; // Limpar completamente
    }
    
    // Bloquear carregamento de assets do Cocos
    const originalCreateElement = document.createElement;
    document.createElement = function(tagName) {
      const element = originalCreateElement.call(document, tagName);
      
      // Bloquear scripts do Cocos
      if (tagName.toLowerCase() === 'script') {
        const originalSetAttribute = element.setAttribute;
        element.setAttribute = function(name, value) {
          if (name === 'src' && value && value.includes('/assets/')) {
            // Permitir apenas assets do admin
            if (!value.includes('admin')) {
              console.log('[Admin Route Guard] Bloqueado script Cocos:', value);
              return;
            }
          }
          return originalSetAttribute.call(this, name, value);
        };
      }
      
      return element;
    };
    
    // Limpar o root do Cocos se ele tentar renderizar
    setInterval(function() {
      const root = document.getElementById('root');
      if (root && root.children.length > 0) {
        // Verificar se tem conteúdo do Cocos (não do React admin)
        const hasReactAdmin = root.querySelector('[class*="admin"]') || 
                             root.querySelector('[class*="Admin"]') ||
                             root.textContent.includes('Painel Administrativo');
        
        if (!hasReactAdmin && root.children.length > 1) {
          console.log('[Admin Route Guard] Limpando conteúdo Cocos do root');
          // Manter apenas o primeiro filho (React)
          while (root.children.length > 1) {
            root.removeChild(root.lastChild);
          }
        }
      }
    }, 100);
  }
})();
