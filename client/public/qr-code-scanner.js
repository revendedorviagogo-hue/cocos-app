/**
 * QR Code Scanner - Leitura de QR code com câmera
 * Funciona em iOS, Android e navegadores desktop
 */

(function() {
  'use strict';

  // Carregar biblioteca de QR code
  function loadQRCodeLibrary() {
    if (window.jsQR) return Promise.resolve();
    
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Criar modal de câmera
  function createCameraModal() {
    const modal = document.createElement('div');
    modal.id = 'qr-scanner-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.95);
      display: none;
      z-index: 10000;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    `;

    modal.innerHTML = `
      <div style="width: 100%; max-width: 400px; display: flex; flex-direction: column; gap: 20px; padding: 20px;">
        <div style="color: white; font-size: 18px; font-weight: bold; text-align: center;">Escanear QR Code</div>
        <video id="qr-video" style="width: 100%; border-radius: 8px; background: black;"></video>
        <canvas id="qr-canvas" style="display: none;"></canvas>
        <div style="color: #999; font-size: 14px; text-align: center;">Aponte a câmera para o QR code</div>
        <button id="qr-close-btn" style="padding: 12px 24px; background: #ff4444; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; font-weight: bold;">Fechar</button>
      </div>
    `;

    document.body.appendChild(modal);
    return modal;
  }

  // Iniciar câmera
  async function startCamera(video) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      video.srcObject = stream;
      return stream;
    } catch (error) {
      console.error('Erro ao acessar câmera:', error);
      alert('Não foi possível acessar a câmera. Verifique as permissões.');
      throw error;
    }
  }

  // Parar câmera
  function stopCamera(stream) {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  }

  // Processar frame de vídeo
  function processFrame(video, canvas, callback) {
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = window.jsQR(imageData.data, imageData.width, imageData.height);
    
    if (code) {
      callback(code.data);
      return true;
    }
    return false;
  }

  // Abrir scanner de QR code
  window.openQRScanner = async function(callback) {
    try {
      await loadQRCodeLibrary();

      let modal = document.getElementById('qr-scanner-modal');
      if (!modal) {
        modal = createCameraModal();
      }

      const video = document.getElementById('qr-video');
      const canvas = document.getElementById('qr-canvas');
      const closeBtn = document.getElementById('qr-close-btn');

      modal.style.display = 'flex';

      const stream = await startCamera(video);

      await new Promise(resolve => {
        video.onloadedmetadata = resolve;
      });

      video.play();

      let scanning = true;
      let animationFrameId;

      const scanFrame = () => {
        if (!scanning) return;

        try {
          if (processFrame(video, canvas, (data) => {
            scanning = false;
            stopCamera(stream);
            modal.style.display = 'none';
            
            if (callback) {
              callback(data);
            }
          })) {
            return;
          }
        } catch (error) {
          console.error('Erro ao processar frame:', error);
        }

        animationFrameId = requestAnimationFrame(scanFrame);
      };

      scanFrame();

      closeBtn.onclick = () => {
        scanning = false;
        cancelAnimationFrame(animationFrameId);
        stopCamera(stream);
        modal.style.display = 'none';
      };

    } catch (error) {
      console.error('Erro ao abrir scanner:', error);
    }
  };

})();
