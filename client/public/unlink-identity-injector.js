/**
 * UNLINK IDENTITY INJECTOR
 * 
 * Injeta botão de "Desvincular Identidades" no menu de Seguridad
 * Funciona com o app Cocos original
 */

(function() {
  'use strict';
  
  console.log('[Unlink Identity] 🔗 Sistema de desvincular identidades ATIVO!');
  
  /**
   * Criar modal para desvincular identidades
   */
  function createUnlinkModal() {
    const modal = document.createElement('div');
    modal.id = 'unlink-identity-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 24px;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    `;
    
    content.innerHTML = `
      <div style="margin-bottom: 24px;">
        <h2 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600; color: #1a1a1a;">
          Desvincular Identidades
        </h2>
        <p style="margin: 0; font-size: 14px; color: #666;">
          Selecione qual identidade deseja desvincular
        </p>
      </div>
      
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 12px;">
          <input type="radio" name="identity-type" value="phone" checked style="margin-right: 8px;">
          <span style="font-size: 14px; color: #333;">Telefone</span>
        </label>
        <label style="display: block; margin-bottom: 12px;">
          <input type="radio" name="identity-type" value="email" style="margin-right: 8px;">
          <span style="font-size: 14px; color: #333;">Email</span>
        </label>
        <label style="display: block;">
          <input type="radio" name="identity-type" value="oauth" style="margin-right: 8px;">
          <span style="font-size: 14px; color: #333;">OAuth/Redes Sociais</span>
        </label>
      </div>
      
      <div id="unlink-message" style="
        margin-bottom: 20px;
        padding: 12px;
        border-radius: 8px;
        font-size: 13px;
        display: none;
      "></div>
      
      <div style="display: flex; gap: 12px;">
        <button id="unlink-cancel" style="
          flex: 1;
          padding: 10px 16px;
          border: 1px solid #ddd;
          background: #f5f5f5;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          color: #333;
          cursor: pointer;
          transition: all 0.2s;
        ">
          Cancelar
        </button>
        <button id="unlink-confirm" style="
          flex: 1;
          padding: 10px 16px;
          border: none;
          background: #ff4444;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
        ">
          Desvincular
        </button>
      </div>
    `;
    
    modal.appendChild(content);
    return modal;
  }
  
  /**
   * Mostrar mensagem no modal
   */
  function showMessage(message, type = 'info') {
    const msgDiv = document.getElementById('unlink-message');
    if (!msgDiv) return;
    
    msgDiv.textContent = message;
    msgDiv.style.display = 'block';
    
    if (type === 'success') {
      msgDiv.style.background = '#e8f5e9';
      msgDiv.style.color = '#2e7d32';
      msgDiv.style.borderLeft = '4px solid #4caf50';
    } else if (type === 'error') {
      msgDiv.style.background = '#ffebee';
      msgDiv.style.color = '#c62828';
      msgDiv.style.borderLeft = '4px solid #f44336';
    } else {
      msgDiv.style.background = '#e3f2fd';
      msgDiv.style.color = '#1565c0';
      msgDiv.style.borderLeft = '4px solid #2196f3';
    }
  }
  
  /**
   * Chamar API para desvincular identidade
   */
  async function unlinkIdentity(identityType) {
    try {
      showMessage('Processando...', 'info');
      
      const response = await fetch(`/api/user/identities/${identityType}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showMessage('✅ Identidade desvinculada com sucesso!', 'success');
        console.log('[Unlink Identity] ✅ Sucesso:', data);
        
        // Fechar modal após 2 segundos
        setTimeout(() => {
          const modal = document.getElementById('unlink-identity-modal');
          if (modal) modal.remove();
        }, 2000);
      } else {
        showMessage(`❌ Erro: ${data.message || 'Falha ao desvincular'}`, 'error');
        console.error('[Unlink Identity] ❌ Erro:', data);
      }
    } catch (error) {
      showMessage(`❌ Erro: ${error.message}`, 'error');
      console.error('[Unlink Identity] ❌ Erro na requisição:', error);
    }
  }
  
  /**
   * Abrir modal de desvincular
   */
  function openUnlinkModal() {
    // Remover modal anterior se existir
    const existingModal = document.getElementById('unlink-identity-modal');
    if (existingModal) existingModal.remove();
    
    const modal = createUnlinkModal();
    document.body.appendChild(modal);
    
    // Event listeners
    document.getElementById('unlink-cancel').addEventListener('click', () => {
      modal.remove();
    });
    
    document.getElementById('unlink-confirm').addEventListener('click', () => {
      const selectedType = document.querySelector('input[name="identity-type"]:checked').value;
      unlinkIdentity(selectedType);
    });
    
    // Fechar ao clicar fora
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }
  
  /**
   * Injetar botão no menu de Seguridad
   */
  function injectButton() {
    // Procurar por "Seguridad" no DOM
    const allElements = document.querySelectorAll('*');
    let securityButton = null;
    
    for (let el of allElements) {
      if (el.textContent && el.textContent.trim() === 'Seguridad') {
        securityButton = el;
        break;
      }
    }
    
    if (!securityButton) {
      console.log('[Unlink Identity] ⚠️ Botão "Seguridad" não encontrado ainda, tentando novamente...');
      setTimeout(injectButton, 1000);
      return;
    }
    
    console.log('[Unlink Identity] ✅ Botão "Seguridad" encontrado!');
    
    // Procurar pelo container do menu
    let menuContainer = securityButton.closest('[class*="menu"], [class*="list"], [class*="container"]');
    if (!menuContainer) {
      menuContainer = securityButton.parentElement;
    }
    
    // Criar novo item de menu para desvincular identidades
    const unlinkItem = document.createElement('div');
    unlinkItem.style.cssText = `
      padding: 12px 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      border-radius: 8px;
      transition: all 0.2s;
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      margin-top: 8px;
    `;
    
    unlinkItem.innerHTML = `
      <span style="font-size: 18px;">🔗</span>
      <div>
        <div style="font-weight: 500; font-size: 14px; color: #333;">
          Desvincular Identidades
        </div>
        <div style="font-size: 12px; color: #666;">
          Remover telefone, email ou redes sociais
        </div>
      </div>
    `;
    
    unlinkItem.addEventListener('click', openUnlinkModal);
    unlinkItem.addEventListener('mouseover', () => {
      unlinkItem.style.background = '#ffe69c';
    });
    unlinkItem.addEventListener('mouseout', () => {
      unlinkItem.style.background = '#fff3cd';
    });
    
    // Inserir após o item de Seguridad
    if (menuContainer && securityButton.parentElement) {
      securityButton.parentElement.parentElement.insertBefore(unlinkItem, securityButton.parentElement.nextSibling);
      console.log('[Unlink Identity] ✅ Botão injetado com sucesso!');
    }
  }
  
  // Aguardar o DOM estar pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectButton);
  } else {
    // Tentar injetar após 2 segundos (app pode estar carregando)
    setTimeout(injectButton, 2000);
  }
  
  // Tentar novamente a cada 3 segundos se não encontrar
  setInterval(() => {
    if (!document.getElementById('unlink-identity-modal') && !document.querySelector('[data-unlink-injected]')) {
      const securityBtn = Array.from(document.querySelectorAll('*')).find(el => 
        el.textContent && el.textContent.trim() === 'Seguridad'
      );
      if (securityBtn && !securityBtn.dataset.unlinkInjected) {
        injectButton();
      }
    }
  }, 3000);
  
})();
