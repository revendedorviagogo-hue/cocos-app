import React, { createContext, useContext, useEffect, useState } from 'react';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import { Device } from '@capacitor/device';

interface DeviceInfo {
  platform: string;
  osVersion: string;
  appVersion: string;
  identifier: string;
}

interface MobileContextType {
  isNative: boolean;
  deviceInfo: DeviceInfo | null;
  isLoading: boolean;
}

const MobileContext = createContext<MobileContextType | undefined>(undefined);

export const MobileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isNative, setIsNative] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeMobile = async () => {
      try {
        // Verificar se está rodando em ambiente nativo
        const info = await Device.getInfo();
        setIsNative(true);

        setDeviceInfo({
          platform: info.platform,
          osVersion: info.osVersion,
          appVersion: '13.2.5',
          identifier: `${info.platform}-${Date.now()}`,
        });

        // Configurar Status Bar
        try {
          await StatusBar.setStyle({ style: Style.Light });
          await StatusBar.setBackgroundColor({ color: '#4f46e5' });
        } catch (err) {
          console.log('StatusBar not available');
        }

        // Configurar Keyboard
        try {
          await Keyboard.setAccessoryBarVisible({ isVisible: true });
        } catch (err) {
          console.log('Keyboard not available');
        }

        // Lidar com back button no Android
        App.addListener('backButton', () => {
          // Implementar lógica de back
        });

        // Lidar com pause/resume
        App.addListener('pause', () => {
          console.log('App paused');
        });

        App.addListener('resume', () => {
          console.log('App resumed');
        });
      } catch (error) {
        // Não está em ambiente nativo (web)
        setIsNative(false);
        console.log('Running in web environment');
      } finally {
        setIsLoading(false);
      }
    };

    initializeMobile();
  }, []);

  return (
    <MobileContext.Provider value={{ isNative, deviceInfo, isLoading }}>
      {children}
    </MobileContext.Provider>
  );
};

export const useMobile = () => {
  const context = useContext(MobileContext);
  if (!context) {
    throw new Error('useMobile must be used within MobileProvider');
  }
  return context;
};
