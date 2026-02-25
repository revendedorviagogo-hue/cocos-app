/**
 * Inject QR Button - Simples e Direto
 * Adiciona botão flutuante de QR code na página
 */

(function() {
  'use strict';

  function createFloatingQRButton() {
    // Verificar se já existe
    if (document.getElementById('floating-qr-button')) {
      return;
    }

    // Criar botão flutuante
    const button = document.createElement('button');
    button.id = 'floating-qr-button';
    button.innerHTML = '📱 QR';
    button.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      font-size: 24px;
      cursor: pointer;
      z-index: 9999;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
      transition: all 0.3s ease;
      font-weight: bold;
    `;

    button.onmouseover = () => {
      button.style.transform = 'scale(1.1)';
      button.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
    };

    button.onmouseout = () => {
      button.style.transform = 'scale(1)';
      button.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
    };

    button.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      console.log('Botão QR clicado');
      
      if (window.openQRScanner) {
        console.log('Abrindo scanner...');
        window.openQRScanner((qrData) => {
          console.log('QR Code lido:', qrData);
          alert('QR Code lido:\n' + qrData);
          
          // Disparar evento com dados do QR code
          window.dispatchEvent(new CustomEvent('qr-code-scanned', {
            detail: { data: qrData }
          }));
        });
      } else {
        console.error('openQRScanner não disponível');
        alert('Scanner de QR code não disponível');
      }
    };

    document.body.appendChild(button);
    console.log('Botão QR flutuante adicionado');
  }

  // Executar quando DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(createFloatingQRButton, 1000);
    });
  } else {
    setTimeout(createFloatingQRButton, 1000);
  }

})();
