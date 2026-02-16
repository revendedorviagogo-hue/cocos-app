import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';

export interface PlatformInfo {
  isNative: boolean;
  isAndroid: boolean;
  isIOS: boolean;
  isWeb: boolean;
  isMobile: boolean;
  platform: 'web' | 'ios' | 'android';
  deviceInfo?: {
    model: string;
    manufacturer: string;
    osVersion: string;
    platform: string;
  };
}

export function usePlatform() {
  // MODO NATIVO FORÇADO - Sempre retorna como se estivesse em app nativo
  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isIOSDevice = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isAndroidDevice = /Android/i.test(navigator.userAgent);
  
  // Forçar modo nativo sempre
  const forcedPlatform = isIOSDevice ? 'ios' : (isAndroidDevice ? 'android' : 'android');
  
  const [platformInfo, setPlatformInfo] = useState<PlatformInfo>({
    isNative: true, // SEMPRE NATIVO
    isAndroid: forcedPlatform === 'android',
    isIOS: forcedPlatform === 'ios',
    isWeb: false, // NUNCA WEB
    isMobile: true, // SEMPRE MOBILE
    platform: forcedPlatform,
  });

  useEffect(() => {
    async function loadDeviceInfo() {
      try {
        const info = await Device.getInfo();
        setPlatformInfo(prev => ({
          ...prev,
          deviceInfo: {
            model: info.model,
            manufacturer: info.manufacturer,
            osVersion: info.osVersion,
            platform: info.platform,
          },
        }));
      } catch (error) {
        console.warn('Failed to load device info:', error);
      }
    }

    if (platformInfo.isNative) {
      loadDeviceInfo();
    }
  }, [platformInfo.isNative]);

  return platformInfo;
}
