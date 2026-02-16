/**
 * FORCE NATIVE MODE + REMOVE UPDATE MODAL
 * 
 * Este script força o app a rodar SEMPRE em modo nativo mobile,
 * mesmo em desktop, e remove COMPLETAMENTE a mensagem de atualização.
 */

(function() {
  'use strict';
  
  console.log('%c[FORCE NATIVE] 🚀 Iniciando override completo...', 'color: #00ff00; font-weight: bold; font-size: 14px;');
  
  // ===================================
  // 1. FORÇAR MODO MOBILE EM TUDO
  // ===================================
  
  // Detectar plataforma real
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
  const isAndroid = /android/i.test(userAgent);
  
  // SEMPRE forçar mobile, mesmo em desktop
  const forcedPlatform = isIOS ? 'ios' : 'android';
  
  console.log(`[FORCE NATIVE] Plataforma forçada: ${forcedPlatform} (SEMPRE MOBILE)`);
  
  // ===================================
  // 2. CRIAR CAPACITOR MOCK COMPLETO
  // ===================================
  
  window.Capacitor = new Proxy({
    platform: forcedPlatform,
    isNative: true,
    isNativePlatform: () => true,
    getPlatform: () => forcedPlatform,
    convertFileSrc: (path) => path,
    Plugins: {},
    registerPlugin: () => ({}),
  }, {
    get(target, prop) {
      if (prop === 'isNativePlatform') return () => true;
      if (prop === 'getPlatform') return () => forcedPlatform;
      if (prop === 'platform') return forcedPlatform;
      if (prop === 'isNative') return true;
      return target[prop] || (() => Promise.resolve());
    }
  });
  
  // ===================================
  // 3. MOCK DE PLUGINS CAPACITOR
  // ===================================
  
  window.Capacitor.Plugins = {
    Device: {
      getInfo: () => Promise.resolve({
        platform: forcedPlatform,
        model: forcedPlatform === 'ios' ? 'iPhone' : 'Android',
        operatingSystem: forcedPlatform,
        osVersion: forcedPlatform === 'ios' ? '15.0' : '12.0',
        manufacturer: forcedPlatform === 'ios' ? 'Apple' : 'Google',
        isVirtual: false,
        webViewVersion: '100.0.0'
      }),
      getId: () => Promise.resolve({ identifier: 'mock-device-id' })
    },
    App: {
      getInfo: () => Promise.resolve({
        name: 'Cocos',
        id: 'capital.cocos.app',
        build: '999',
        version: '999.0.0'
      }),
      addListener: () => ({ remove: () => {} })
    },
    StatusBar: {
      setStyle: () => Promise.resolve(),
      setBackgroundColor: () => Promise.resolve(),
      show: () => Promise.resolve(),
      hide: () => Promise.resolve()
    },
    Keyboard: {
      addListener: () => ({ remove: () => {} }),
      show: () => Promise.resolve(),
      hide: () => Promise.resolve()
    },
    Camera: {
      getPhoto: () => Promise.resolve({ webPath: 'mock-photo.jpg' })
    },
    Share: {
      share: () => Promise.resolve()
    },
    Preferences: {
      get: () => Promise.resolve({ value: null }),
      set: () => Promise.resolve(),
      remove: () => Promise.resolve(),
      clear: () => Promise.resolve()
    }
  };
  
  // ===================================
  // 4. CORDOVA MOCK
  // ===================================
  
  window.cordova = {
    platformId: forcedPlatform,
    version: '12.0.0',
    plugins: {
      AppboyPlugin: {
        changeUser: () => {},
        logCustomEvent: () => {},
        setFirstName: () => {},
        setLastName: () => {},
        setEmail: () => {}
      }
    },
    exec: () => {}
  };
  
  // ===================================
  // 5. AMPLITUDE (AMPLI) MOCK
  // ===================================
  
  window.ampli = {
    isLoaded: true,
    load: () => Promise.resolve(),
    identify: () => {},
    track: () => {},
    setUserId: () => {},
    setGroup: () => {}
  };
  
  // ===================================
  // 6. FORÇAR PROTOCOL CAPACITOR
  // ===================================
  
  Object.defineProperty(window.location, 'protocol', {
    get: () => 'capacitor:',
    configurable: true
  });
  
  // ===================================
  // 7. DISPARAR EVENTO DEVICEREADY
  // ===================================
  
  setTimeout(() => {
    const event = new Event('deviceready');
    document.dispatchEvent(event);
    console.log('[FORCE NATIVE] ✅ deviceready disparado');
  }, 100);
  
  // ===================================
  // 8. REMOVER MENSAGEM DE ATUALIZAÇÃO
  // ===================================
  
  // Lista de classes CSS do modal de atualização
  const updateModalClasses = [
    '_backgroundContainer_8bd8n_24',
    '_bottomSheet_8bd8n_24',
    '_contentWrapper_yggvz_24',
    '_buttonWrapper_yggvz_33'
  ];
  
  // Lista de textos a bloquear
  const updateTexts = [
    '¡Atención!',
    'Hay una actualización disponible',
    'Presioná para actualizar',
    'Actualizar'
  ];
  
  // Função para remover elementos do DOM
  function removeUpdateModal() {
    // Remover por classes
    updateModalClasses.forEach(className => {
      const elements = document.querySelectorAll(`.${className}`);
      elements.forEach(el => {
        console.log('[FORCE NATIVE] 🗑️ Removendo modal de atualização:', className);
        el.remove();
      });
    });
    
    // Remover por texto
    const allElements = document.querySelectorAll('*');
    allElements.forEach(el => {
      const text = el.textContent || '';
      updateTexts.forEach(updateText => {
        if (text.includes(updateText)) {
          // Verificar se é o elemento pai do modal
          if (el.querySelector('svg') || el.querySelector('button')) {
            console.log('[FORCE NATIVE] 🗑️ Removendo elemento com texto de atualização');
            el.remove();
          }
        }
      });
    });
  }
  
  // Executar remoção imediatamente
  removeUpdateModal();
  
  // Executar remoção após carregamento
  window.addEventListener('load', removeUpdateModal);
  
  // Executar remoção periodicamente (a cada 500ms)
  setInterval(removeUpdateModal, 500);
  
  // Observer para detectar novos elementos
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) { // Element node
          // Verificar se é o modal de atualização
          const hasUpdateClass = updateModalClasses.some(className => 
            node.classList && node.classList.contains(className)
          );
          
          if (hasUpdateClass) {
            console.log('[FORCE NATIVE] 🗑️ Modal de atualização detectado e removido');
            node.remove();
          }
          
          // Verificar texto
          const text = node.textContent || '';
          const hasUpdateText = updateTexts.some(updateText => text.includes(updateText));
          
          if (hasUpdateText && (node.querySelector('svg') || node.querySelector('button'))) {
            console.log('[FORCE NATIVE] 🗑️ Elemento de atualização detectado e removido');
            node.remove();
          }
        }
      });
    });
  });
  
  // Observar mudanças no DOM
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
  
  // ===================================
  // 9. BLOQUEAR VERIFICAÇÕES DE VERSÃO
  // ===================================
  
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const url = args[0];
    if (typeof url === 'string' && (url.includes('version') || url.includes('update') || url.includes('actualiz'))) {
      console.log('[FORCE NATIVE] 🚫 Bloqueada verificação de versão:', url);
      // Retornar resposta fake dizendo que está atualizado
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ 
          updateAvailable: false, 
          latestVersion: '999.0.0',
          currentVersion: '999.0.0',
          forceUpdate: false
        }),
        text: () => Promise.resolve(''),
        status: 200
      });
    }
    return originalFetch.apply(this, args);
  };
  
  // ===================================
  // 10. BLOQUEAR ALERTS/CONFIRMS
  // ===================================
  
  const originalAlert = window.alert;
  window.alert = function(message) {
    if (message && typeof message === 'string') {
      const hasUpdateText = updateTexts.some(text => message.includes(text));
      if (hasUpdateText) {
        console.log('[FORCE NATIVE] 🚫 Bloqueado alert de atualização');
        return;
      }
    }
    return originalAlert.apply(this, arguments);
  };
  
  const originalConfirm = window.confirm;
  window.confirm = function(message) {
    if (message && typeof message === 'string') {
      const hasUpdateText = updateTexts.some(text => message.includes(text));
      if (hasUpdateText) {
        console.log('[FORCE NATIVE] 🚫 Bloqueado confirm de atualização');
        return false;
      }
    }
    return originalConfirm.apply(this, arguments);
  };
  
  // ===================================
  // 11. SUPRIMIR ERROS DE CONSOLE
  // ===================================
  
  const originalConsoleError = console.error;
  console.error = function(...args) {
    const message = args.join(' ');
    
    // Bloquear erros do GTM
    if (message.includes('googletagmanager') || message.includes('GTM')) {
      return;
    }
    
    // Bloquear erros do Ampli
    if (message.includes('Ampli is not yet initialized')) {
      return;
    }
    
    // Bloquear erros do cordova
    if (message.includes('cordova is not defined')) {
      return;
    }
    
    return originalConsoleError.apply(console, args);
  };
  
  // ===================================
  // 12. BLOQUEAR ERROS GLOBAIS
  // ===================================
  
  window.addEventListener('error', (event) => {
    const message = event.message || '';
    
    // Bloquear erros do GTM
    if (message.includes('googletagmanager') || message.includes('addEventListener')) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  }, true);
  
  window.onerror = function(message, source, lineno, colno, error) {
    if (typeof message === 'string') {
      // Bloquear erros do GTM
      if (message.includes('googletagmanager') || message.includes('addEventListener')) {
        return true; // Prevenir erro
      }
    }
    return false;
  };
  
  // ===================================
  // FINALIZAÇÃO
  // ===================================
  
  console.log('%c[FORCE NATIVE] ✅ Override COMPLETO!', 'color: #00ff00; font-weight: bold; font-size: 16px;');
  console.log('[FORCE NATIVE] Platform:', forcedPlatform, '(SEMPRE MOBILE)');
  console.log('[FORCE NATIVE] Capacitor.isNativePlatform():', window.Capacitor.isNativePlatform());
  console.log('[FORCE NATIVE] Capacitor.getPlatform():', window.Capacitor.getPlatform());
  console.log('[FORCE NATIVE] Modal de atualização: REMOVIDO');
  
})();
