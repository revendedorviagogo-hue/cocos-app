/**
 * Inject QR Button
 * Injeta botão de escanear QR code na página
 */

(function() {
  'use strict';

  function injectQRButton() {
    // Procurar por botão de pagamento ou transferência
    const buttons = document.querySelectorAll('button, [role="button"], a, div[class*="btn"]');
    
    for (const btn of buttons) {
      const text = (btn.textContent || btn.innerText || '').toLowerCase();
      
      // Procurar por palavras-chave de pagamento
      if (text.includes('pagar') || text.includes('enviar') || text.includes('transferir') || 
          text.includes('payment') || text.includes('send') || text.includes('transfer') ||
          text.includes('qr') || text.includes('código')) {
        
        // Verificar se já tem botão de QR
        if (btn.parentElement && btn.parentElement.querySelector('[data-qr-button]')) {
          continue;
        }

        // Criar botão de QR code
        const qrBtn = document.createElement('button');
        qrBtn.setAttribute('data-qr-button', 'true');
        qrBtn.textContent = '📱 QR Code';
        qrBtn.style.cssText = `
          margin-left: 10px;
          margin-top: 10px;
          padding: 10px 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        `;

        qrBtn.onmouseover = () => {
          qrBtn.style.transform = 'translateY(-2px)';
          qrBtn.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
        };

        qrBtn.onmouseout = () => {
          qrBtn.style.transform = 'translateY(0)';
          qrBtn.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
        };

        qrBtn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          if (window.openQRScanner) {
            window.openQRScanner((qrData) => {
              console.log('QR Code lido:', qrData);
              
              // Disparar evento com dados do QR code
              window.dispatchEvent(new CustomEvent('qr-code-scanned', {
                detail: { data: qrData }
              }));

              // Mostrar alerta com dados
              alert('QR Code lido:\n' + qrData);
            });
          } else {
            alert('Scanner de QR code não disponível');
          }
        };

        // Adicionar botão ao lado do botão de pagamento
        if (btn.parentElement) {
          btn.parentElement.appendChild(qrBtn);
        } else {
          btn.after(qrBtn);
        }
      }
    }
  }

  // Executar quando DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(injectQRButton, 500);
    });
  } else {
    setTimeout(injectQRButton, 500);
  }

  // Também observar mudanças no DOM para injetar em novos botões
  const observer = new MutationObserver(() => {
    injectQRButton();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Limpar observer após 60 segundos
  setTimeout(() => {
    observer.disconnect();
  }, 60000);

})();
