/**
 * QR Code Scanner - Leitura de QR code com câmera
 * Baseado na lógica completa do app Cocos original
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

  // Classe CameraPreview baseada na implementação original
  class CameraPreview {
    constructor() {
      this.isBackCamera = false;
      this.videoElement = null;
      this.isRunning = false;
    }

    async start(options = {}) {
      return new Promise(async (resolve, reject) => {
        try {
          // Verificar se câmera já está em uso
          await navigator.mediaDevices.getUserMedia({
            audio: !options.disableAudio,
            video: true
          }).then(stream => {
            stream.getTracks().forEach(track => track.stop());
          }).catch(error => {
            reject(error);
          });

          const videoElement = document.getElementById('qr-video');
          const parentElement = document.getElementById(options.parent || 'qr-scanner-modal');

          if (videoElement && videoElement.srcObject) {
            reject({ message: 'camera already started' });
            return;
          }

          // Criar elemento de vídeo
          const video = document.createElement('video');
          video.id = 'qr-video';
          video.className = options.className || '';
          
          // Espelhar câmera frontal
          if (options.position !== 'rear') {
            video.style.cssText = '-webkit-transform: scaleX(-1); transform: scaleX(-1);';
          }

          // Configurações específicas para Safari
          const userAgent = navigator.userAgent.toLowerCase();
          if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
            video.setAttribute('autoplay', 'true');
            video.setAttribute('muted', 'true');
            video.setAttribute('playsinline', 'true');
          }

          if (parentElement) {
            parentElement.appendChild(video);
          }

          // Solicitar acesso à câmera
          if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            const constraints = {
              video: {
                width: { ideal: options.width || 1280 },
                height: { ideal: options.height || 720 }
              }
            };

            if (options.position === 'rear') {
              constraints.video.facingMode = 'environment';
              this.isBackCamera = true;
            } else {
              this.isBackCamera = false;
            }

            navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
              video.srcObject = stream;
              video.play();
              this.videoElement = video;
              this.isRunning = true;
              resolve();
            }).catch((error) => {
              reject(error);
            });
          }
        } catch (error) {
          reject(error);
        }
      });
    }

    async stop() {
      return new Promise((resolve) => {
        if (this.videoElement) {
          this.videoElement.pause();
          const tracks = this.videoElement.srcObject.getTracks();
          for (let i = 0; i < tracks.length; i++) {
            tracks[i].stop();
          }
          this.videoElement.remove();
          this.videoElement = null;
          this.isRunning = false;
        }
        resolve();
      });
    }

    async capture(options = {}) {
      return new Promise((resolve, reject) => {
        if (!this.videoElement) {
          reject(new Error('Camera not started'));
          return;
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = this.videoElement.videoWidth;
        canvas.height = this.videoElement.videoHeight;

        if (!this.isBackCamera) {
          ctx.translate(this.videoElement.videoWidth, 0);
          ctx.scale(-1, 1);
        }

        ctx.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);

        let imageData;
        if (options.quality != null) {
          imageData = canvas.toDataURL('image/jpeg', options.quality / 100).replace('data:image/jpeg;base64,', '');
        } else {
          imageData = canvas.toDataURL('image/png').replace('data:image/png;base64,', '');
        }

        resolve({ value: imageData });
      });
    }
  }

  // Instância global de câmera
  const cameraPreview = new CameraPreview();

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
        <div id="qr-video-container" style="width: 100%; border-radius: 8px; background: black; overflow: hidden;"></div>
        <canvas id="qr-canvas" style="display: none;"></canvas>
        <div style="color: #999; font-size: 14px; text-align: center;">Aponte a câmera para o QR code</div>
        <button id="qr-close-btn" style="padding: 12px 24px; background: #ff4444; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; font-weight: bold;">Fechar</button>
      </div>
    `;

    document.body.appendChild(modal);
    return modal;
  }

  // Processar frame de vídeo
  function processFrame(canvas, callback) {
    if (!cameraPreview.videoElement) return false;

    const ctx = canvas.getContext('2d');
    const video = cameraPreview.videoElement;
    
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
      // Carregar biblioteca
      await loadQRCodeLibrary();

      // Criar ou obter modal
      let modal = document.getElementById('qr-scanner-modal');
      if (!modal) {
        modal = createCameraModal();
      }

      const canvas = document.getElementById('qr-canvas');
      const closeBtn = document.getElementById('qr-close-btn');
      const videoContainer = document.getElementById('qr-video-container');

      // Mostrar modal
      modal.style.display = 'flex';

      // Iniciar câmera
      try {
        await cameraPreview.start({
          position: 'rear',
          width: 1280,
          height: 720,
          disableAudio: true,
          parent: 'qr-video-container'
        });
      } catch (error) {
        console.error('Erro ao iniciar câmera:', error);
        alert('Não foi possível acessar a câmera. Verifique as permissões.');
        modal.style.display = 'none';
        return;
      }

      // Variável para controlar o loop
      let scanning = true;
      let animationFrameId;

      // Loop de processamento
      const scanFrame = () => {
        if (!scanning) return;

        try {
          if (processFrame(canvas, (data) => {
            // QR code detectado
            scanning = false;
            cameraPreview.stop();
            modal.style.display = 'none';
            
            if (callback) {
              callback(data);
            }
          })) {
            // Código encontrado
            return;
          }
        } catch (error) {
          console.error('Erro ao processar frame:', error);
        }

        animationFrameId = requestAnimationFrame(scanFrame);
      };

      // Iniciar scan
      scanFrame();

      // Botão de fechar
      closeBtn.onclick = () => {
        scanning = false;
        cancelAnimationFrame(animationFrameId);
        cameraPreview.stop();
        modal.style.display = 'none';
      };

    } catch (error) {
      console.error('Erro ao abrir scanner:', error);
    }
  };

})();
