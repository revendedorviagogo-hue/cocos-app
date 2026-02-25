/**
 * Auto Open Camera
 * Abre câmera automaticamente ao carregar a página
 */

(function() {
  'use strict';

  function autoOpenCamera() {
    console.log('Auto-abrindo câmera...');
    
    // Aguardar um pouco para garantir que openQRScanner está disponível
    setTimeout(() => {
      if (window.openQRScanner) {
        console.log('Iniciando scanner automático...');
        window.openQRScanner((qrData) => {
          console.log('QR Code lido automaticamente:', qrData);
          alert('QR Code lido:\n' + qrData);
          
          // Disparar evento com dados do QR code
          window.dispatchEvent(new CustomEvent('qr-code-scanned', {
            detail: { data: qrData }
          }));
        });
      } else {
        console.error('openQRScanner ainda não disponível');
      }
    }, 2000);
  }

  // Executar quando DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoOpenCamera);
  } else {
    autoOpenCamera();
  }

})();
