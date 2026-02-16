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
  const [platformInfo, setPlatformInfo] = useState<PlatformInfo>({
    isNative: Capacitor.isNativePlatform(),
    isAndroid: Capacitor.getPlatform() === 'android',
    isIOS: Capacitor.getPlatform() === 'ios',
    isWeb: Capacitor.getPlatform() === 'web',
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    platform: Capacitor.getPlatform() as 'web' | 'ios' | 'android',
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
