/**
 * CAPACITOR MOCK - FORÇA MODO NATIVO TOTAL
 * Este script FORÇA o navegador a se comportar EXATAMENTE como app nativo
 * DESABILITA TODAS as verificações de plataforma do código original
 */

(function() {
  'use strict';
  
  console.log('[CAPACITOR MOCK] Iniciando override total...');
  
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
  
  // Override de location.protocol para simular capacitor://
  Object.defineProperty(window.location, 'protocol', {
    get: function() { return 'capacitor:'; },
    configurable: true
  });
  
  // Override de location.origin
  Object.defineProperty(window.location, 'origin', {
    get: function() { return 'capacitor://localhost'; },
    configurable: true
  });
  
  // Garantir que Capacitor está disponível globalmente
  if (typeof window !== 'undefined') {
    window.Capacitor = window.Capacitor || {};
    Object.assign(window.Capacitor, {
      platform: platform,
      isNative: true,
      isNativePlatform: function() { return true; },
      getPlatform: function() { return platform; },
      convertFileSrc: function(path) { return path; },
      Plugins: window.Capacitor.Plugins || {}
    });
  }
  
  console.log('[CAPACITOR MOCK] ✅ Modo nativo TOTAL ativado!');
  console.log('[CAPACITOR MOCK] Platform:', platform);
  console.log('[CAPACITOR MOCK] Protocol:', window.location.protocol);
  console.log('[CAPACITOR MOCK] Origin:', window.location.origin);
  console.log('[CAPACITOR MOCK] isNativePlatform:', window.Capacitor.isNativePlatform());
})();
