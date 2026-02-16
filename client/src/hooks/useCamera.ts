import { useCallback, useState } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

export interface UseCameraOptions {
  width?: number;
  height?: number;
  quality?: number;
}

export const useCamera = (options: UseCameraOptions = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const takePhoto = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const image = await Camera.getPhoto({
        quality: options.quality || 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        width: options.width,
        height: options.height,
      });

      return image.dataUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao tirar foto';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  const pickImage = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const image = await Camera.getPhoto({
        quality: options.quality || 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
        width: options.width,
        height: options.height,
      });

      return image.dataUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao selecionar imagem';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  const scanQRCode = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Para escanear QR code, usamos a câmera com a intenção de capturar
      // Em produção, você usaria uma biblioteca como @capacitor-community/barcode-scanner
      const image = await Camera.getPhoto({
        quality: 100,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      // Aqui você processaria a imagem com uma biblioteca de QR code
      // Por exemplo: jsQR ou zxing
      return image.dataUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao escanear QR code';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    takePhoto,
    pickImage,
    scanQRCode,
    isLoading,
    error,
  };
};
