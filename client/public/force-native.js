/**
 * FORCE NATIVE MODE - OVERRIDE TOTAL
 * Este script DEVE rodar ANTES de qualquer outro código
 * Força TODAS as verificações de plataforma a retornarem "nativo"
 */

(function() {
  'use strict';
  
  console.log('%c[FORCE NATIVE] 🚀 Iniciando override TOTAL...', 'color: #00ff00; font-weight: bold; font-size: 14px;');
  
  // Detectar plataforma
  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const forcedPlatform = isIOS ? 'ios' : (isAndroid ? 'android' : 'android');
  
  // 1. CRIAR CAPACITOR GLOBAL ANTES DE TUDO
  window.Capacitor = {
    platform: forcedPlatform,
    isNative: true,
    isNativePlatform: function() { 
      console.log('[FORCE NATIVE] isNativePlatform() chamado -> retornando TRUE');
      return true; 
    },
    getPlatform: function() { 
      console.log('[FORCE NATIVE] getPlatform() chamado -> retornando', forcedPlatform);
      return forcedPlatform; 
    },
    convertFileSrc: function(path) { return path; },
    Plugins: {},
    registerPlugin: function(name, plugin) {
      this.Plugins[name] = plugin;
      return plugin;
    }
  };
  
  // 2. CONGELAR CAPACITOR PARA EVITAR SOBRESCRITA
  Object.freeze(window.Capacitor.isNativePlatform);
  Object.freeze(window.Capacitor.getPlatform);
  
  // 3. OVERRIDE DE LOCATION (tenta, mas pode falhar em alguns navegadores)
  try {
    Object.defineProperty(window.location, 'protocol', {
      get: function() { return 'capacitor:'; },
      configurable: false
    });
  } catch(e) {
    console.warn('[FORCE NATIVE] Não foi possível sobrescrever location.protocol:', e.message);
  }
  
  try {
    Object.defineProperty(window.location, 'origin', {
      get: function() { return 'capacitor://localhost'; },
      configurable: false
    });
  } catch(e) {
    console.warn('[FORCE NATIVE] Não foi possível sobrescrever location.origin:', e.message);
  }
  
  // 4. CRIAR PROXY PARA INTERCEPTAR QUALQUER ACESSO A CAPACITOR
  window.Capacitor = new Proxy(window.Capacitor, {
    get: function(target, prop) {
      if (prop === 'isNativePlatform') {
        return function() { return true; };
      }
      if (prop === 'getPlatform') {
        return function() { return forcedPlatform; };
      }
      if (prop === 'isNative') {
        return true;
      }
      if (prop === 'platform') {
        return forcedPlatform;
      }
      return target[prop];
    }
  });
  
  // 5. ADICIONAR PLUGINS MOCK
  window.Capacitor.Plugins.Device = {
    getInfo: async function() {
      return {
        model: forcedPlatform === 'ios' ? 'iPhone' : 'Android Device',
        platform: forcedPlatform,
        operatingSystem: forcedPlatform,
        osVersion: forcedPlatform === 'ios' ? '15.0' : '12.0',
        manufacturer: forcedPlatform === 'ios' ? 'Apple' : 'Google',
        isVirtual: false,
        webViewVersion: '100.0'
      };
    }
  };
  
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
  
  window.Capacitor.Plugins.Camera = {
    getPhoto: async function(options) {
      console.log('[FORCE NATIVE] Camera.getPhoto chamado');
      return {
        dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        format: 'png'
      };
    }
  };
  
  window.Capacitor.Plugins.Share = {
    share: async function(options) {
      console.log('[FORCE NATIVE] Share.share chamado:', options);
      return { activityType: 'mock.share' };
    }
  };
  
  // 6. INTERCEPTAR DOCUMENT.ADDEVENTLISTENER PARA DEVICEREADY
  const originalAddEventListener = document.addEventListener;
  document.addEventListener = function(event, handler, options) {
    if (event === 'deviceready') {
      console.log('[FORCE NATIVE] deviceready event interceptado - disparando imediatamente');
      setTimeout(() => handler({ type: 'deviceready' }), 0);
      return;
    }
    return originalAddEventListener.call(this, event, handler, options);
  };
  
  // 7. DISPARAR DEVICEREADY MANUALMENTE
  setTimeout(() => {
    const event = new Event('deviceready');
    document.dispatchEvent(event);
    console.log('[FORCE NATIVE] deviceready event disparado manualmente');
  }, 100);
  
  console.log('%c[FORCE NATIVE] ✅ Override COMPLETO!', 'color: #00ff00; font-weight: bold; font-size: 16px;');
  console.log('[FORCE NATIVE] Platform:', forcedPlatform);
  console.log('[FORCE NATIVE] Capacitor.isNativePlatform():', window.Capacitor.isNativePlatform());
  console.log('[FORCE NATIVE] Capacitor.getPlatform():', window.Capacitor.getPlatform());
  console.log('[FORCE NATIVE] Location protocol:', window.location.protocol);
  
})();
