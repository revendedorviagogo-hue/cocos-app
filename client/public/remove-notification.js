/**
 * REMOVE NOTIFICATION
 * Remove a notificação de atualização
 */
(function() {
  'use strict';
  
  // Remover a cada 100ms
  const interval = setInterval(function() {
    try {
      // Procurar por elementos com "Atención" ou "actualiz"
      const allElements = document.querySelectorAll('*');
      allElements.forEach(function(el) {
        try {
          const text = el.textContent.toLowerCase();
          if (text.includes('atención') && text.includes('actualización')) {
            // Encontrar o parent mais próximo que é um modal/div
            let parent = el.parentElement;
            while (parent && parent !== document.body) {
              const style = window.getComputedStyle(parent);
              // Se for um modal ou container, remover
              if (style.position === 'fixed' || style.position === 'absolute' || parent.className.includes('modal') || parent.className.includes('sheet')) {
                parent.remove();
                clearInterval(interval);
                console.log('[Remove Notification] Notificação removida!');
                return;
              }
              parent = parent.parentElement;
            }
          }
        } catch (e) {}
      });
    } catch (e) {}
  }, 100);
  
  // Parar após 5 segundos
  setTimeout(function() {
    clearInterval(interval);
  }, 5000);
})();
