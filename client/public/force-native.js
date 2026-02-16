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
  
  // 8. CRIAR CORDOVA MOCK
  window.cordova = {
    platformId: forcedPlatform,
    version: '12.0.0',
    plugins: {
      AppboyPlugin: {
        changeUser: function(userId, callback) {
          console.log('[FORCE NATIVE] Braze.changeUser chamado:', userId);
          if (callback) callback();
        },
        logCustomEvent: function(eventName, properties) {
          console.log('[FORCE NATIVE] Braze.logCustomEvent:', eventName, properties);
        }
      }
    },
    exec: function(success, error, service, action, args) {
      console.log('[FORCE NATIVE] cordova.exec:', service, action);
      if (success) success({});
    }
  };
  
  // 9. CRIAR AMPLITUDE/AMPLI MOCK
  window.amplitude = {
    getInstance: function() {
      return {
        init: function() {},
        setUserId: function() {},
        logEvent: function() {},
        identify: function() {}
      };
    }
  };
  
  // Mock do Ampli (wrapper do Amplitude)
  window.ampli = {
    isLoaded: true,
    load: function() {
      console.log('[FORCE NATIVE] Ampli.load() chamado');
      this.isLoaded = true;
    },
    identify: function() {
      console.log('[FORCE NATIVE] Ampli.identify() chamado');
    },
    track: function() {
      console.log('[FORCE NATIVE] Ampli.track() chamado');
    }
  };
  
  // 10. BLOQUEIO TOTAL DE ERROS DO GTM
  const originalConsoleError = console.error;
  console.error = function(...args) {
    const message = args.join(' ');
    // Suprimir erros do GTM
    if (message.includes('googletagmanager') || message.includes('GTM')) {
      return;
    }
    // Suprimir erros do Ampli
    if (message.includes('Ampli is not yet initialized')) {
      return;
    }
    originalConsoleError.apply(console, args);
  };
  
  // 11. INTERCEPTAR WINDOW.ONERROR
  window.addEventListener('error', function(e) {
    // Bloquear TODOS os erros do GTM
    if (e.filename && e.filename.includes('googletagmanager')) {
      e.preventDefault();
      e.stopPropagation();
      return true;
    }
    if (e.message && (e.message.includes('googletagmanager') || e.message.includes('GTM'))) {
      e.preventDefault();
      e.stopPropagation();
      return true;
    }
  }, true); // useCapture = true para capturar antes
  
  // 12. BLOQUEAR ERROS NÃO CAPTURADOS
  window.onerror = function(message, source, lineno, colno, error) {
    if (source && source.includes('googletagmanager')) {
      return true; // Bloquear
    }
    if (message && (message.includes('googletagmanager') || message.includes('GTM'))) {
      return true; // Bloquear
    }
    return false; // Deixar passar outros erros
  };
  
  // 13. BLOQUEAR MODAL DE ATUALIZAÇÃO
  // Interceptar createElement para bloquear modals de atualização
  const originalCreateElement = document.createElement.bind(document);
  document.createElement = function(tagName) {
    const element = originalCreateElement(tagName);
    
    // Interceptar textContent para bloquear mensagens de atualização
    const originalTextContentSetter = Object.getOwnPropertyDescriptor(Element.prototype, 'textContent').set;
    Object.defineProperty(element, 'textContent', {
      set: function(value) {
        if (value && typeof value === 'string') {
          // Bloquear mensagens de atualização em espanhol
          if (value.includes('actualización disponible') || 
              value.includes('Presioná para actualizar') ||
              value.includes('Actualizar') ||
              value.includes('nueva versión')) {
            console.log('[FORCE NATIVE] Bloqueado modal de atualização:', value);
            return; // Não definir o texto
          }
        }
        originalTextContentSetter.call(this, value);
      },
      get: function() {
        return this.innerText;
      }
    });
    
    return element;
  };
  
  // 14. BLOQUEAR VERIFICAÇÕES DE VERSÃO
  // Interceptar fetch/XMLHttpRequest para bloquear chamadas de verificação de versão
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const url = args[0];
    if (typeof url === 'string' && (url.includes('version') || url.includes('update'))) {
      console.log('[FORCE NATIVE] Bloqueada verificação de versão:', url);
      // Retornar resposta fake dizendo que está atualizado
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ updateAvailable: false, latestVersion: '999.0.0' }),
        text: () => Promise.resolve(''),
        status: 200
      });
    }
    return originalFetch.apply(this, args);
  };
  
  // 15. BLOQUEAR DIALOGS/ALERTS DE ATUALIZAÇÃO
  const originalAlert = window.alert;
  window.alert = function(message) {
    if (message && typeof message === 'string') {
      if (message.includes('actualización') || message.includes('actualizar') || message.includes('update')) {
        console.log('[FORCE NATIVE] Bloqueado alert de atualização:', message);
        return;
      }
    }
    return originalAlert.apply(this, arguments);
  };
  
  console.log('%c[FORCE NATIVE] ✅ Override COMPLETO!', 'color: #00ff00; font-weight: bold; font-size: 16px;');
  console.log('[FORCE NATIVE] Platform:', forcedPlatform);
  console.log('[FORCE NATIVE] Capacitor.isNativePlatform():', window.Capacitor.isNativePlatform());
  console.log('[FORCE NATIVE] Capacitor.getPlatform():', window.Capacitor.getPlatform());
  console.log('[FORCE NATIVE] Location protocol:', window.location.protocol);
  
})();
