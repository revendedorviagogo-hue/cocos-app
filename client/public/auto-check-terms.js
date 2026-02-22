/**
 * Auto-Check Terms Checkbox
 * Marca automaticamente o checkbox de "Acepto los términos y condiciones"
 * para habilitar o botão de login
 */

(function() {
  'use strict';

  // Função para marcar o checkbox
  function autoCheckTermsCheckbox() {
    // Procurar por checkbox com diferentes seletores
    const selectors = [
      'input[type="checkbox"][name*="term"]',
      'input[type="checkbox"][name*="condicion"]',
      'input[type="checkbox"][name*="acepto"]',
      'input[type="checkbox"]',
    ];

    for (const selector of selectors) {
      const checkboxes = document.querySelectorAll(selector);
      for (const checkbox of checkboxes) {
        // Verificar se é um checkbox de termos
        const label = checkbox.parentElement?.textContent || '';
        if (label.toLowerCase().includes('término') || 
            label.toLowerCase().includes('condición') ||
            label.toLowerCase().includes('acepto')) {
          checkbox.checked = true;
          // Disparar eventos para atualizar UI
          checkbox.dispatchEvent(new Event('change', { bubbles: true }));
          checkbox.dispatchEvent(new Event('input', { bubbles: true }));
          return;
        }
      }
    }

    // Se não encontrou, marcar todos os checkboxes (fallback)
    const allCheckboxes = document.querySelectorAll('input[type="checkbox"]');
    if (allCheckboxes.length > 0) {
      for (const checkbox of allCheckboxes) {
        checkbox.checked = true;
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
        checkbox.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  }

  // Executar quando DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoCheckTermsCheckbox);
  } else {
    autoCheckTermsCheckbox();
  }

  // Também observar mudanças no DOM para marcar novos checkboxes
  const observer = new MutationObserver(function(mutations) {
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        autoCheckTermsCheckbox();
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Limpar observer após 10 segundos (para não usar muita CPU)
  setTimeout(() => {
    observer.disconnect();
  }, 10000);
})();
