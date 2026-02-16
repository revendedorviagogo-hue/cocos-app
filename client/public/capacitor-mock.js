/**
 * CAPACITOR MOCK - Simula ambiente nativo no navegador
 * Este script faz o navegador se comportar como se fosse um app nativo
 */

(function() {
  'use strict';
  
  // Detectar plataforma do dispositivo
  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const platform = isIOS ? 'ios' : (isAndroid ? 'android' : 'android');
  
  // Criar objeto Capacitor mock
  window.Capacitor = {
    platform: platform,
    isNative: true,
    isNativePlatform: function() { return true; },
    getPlatform: function() { return platform; },
    convertFileSrc: function(path) { return path; },
    Plugins: {},
    registerPlugin: function(name, plugin) {
      this.Plugins[name] = plugin;
      return plugin;
    }
  };
  
  // Mock Device plugin
  window.Capacitor.Plugins.Device = {
    getInfo: async function() {
      return {
        model: platform === 'ios' ? 'iPhone' : 'Android Device',
        platform: platform,
        operatingSystem: platform,
        osVersion: platform === 'ios' ? '15.0' : '12.0',
        manufacturer: platform === 'ios' ? 'Apple' : 'Google',
        isVirtual: false,
        webViewVersion: '100.0'
      };
    },
    getId: async function() {
      return {
        identifier: 'mock-device-' + Math.random().toString(36).substr(2, 9)
      };
    }
  };
  
  // Mock App plugin
  window.Capacitor.Plugins.App = {
    getInfo: async function() {
      return {
        name: 'Cocos',
        id: 'com.cocos.app',
        build: '1',
        version: '1.0.0'
      };
    },
    addListener: function() {
      return { remove: function() {} };
    }
  };
  
  // Mock Camera plugin
  window.Capacitor.Plugins.Camera = {
    getPhoto: async function(options) {
      alert('Câmera disponível em modo nativo! (Simulado)');
      return {
        dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        format: 'png'
      };
    }
  };
  
  // Mock Share plugin
  window.Capacitor.Plugins.Share = {
    share: async function(options) {
      alert('Compartilhar: ' + (options.title || options.text || 'Conteúdo'));
      return { activityType: 'mock.share' };
    }
  };
  
  console.log('[Capacitor Mock] Modo nativo forçado ativado! Platform:', platform);
})();
