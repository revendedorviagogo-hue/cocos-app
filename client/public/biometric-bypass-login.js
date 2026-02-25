/**
 * BIOMETRIC BYPASS LOGIN SYSTEM
 * 
 * Sistema que burla validação de servidor e faz login automático
 * - Intercepta requisições de login
 * - Simula resposta de servidor bem-sucedida
 * - Cria sessão autenticada localmente
 * - Faz redirecionamento para dashboard
 */

(function() {
  'use strict';

  const BiometricBypassLogin = {
    // Credenciais pré-configuradas
    STORED_EMAIL: 'revendedorviagogo@gmail.com',
    STORED_PASSWORD: '@Painosso123',
    
    DB_NAME: 'CocosAuthDB',
    STORE_NAME: 'biometric_credentials',

    // ============================================
    // 1. INICIALIZAR BANCO DE DADOS
    // ============================================

    initDB: async () => {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(BiometricBypassLogin.DB_NAME, 1);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains(BiometricBypassLogin.STORE_NAME)) {
            db.createObjectStore(BiometricBypassLogin.STORE_NAME, { keyPath: 'id', autoIncrement: true });
          }
        };
      });
    },

    // ============================================
    // 2. ARMAZENAR CREDENCIAIS
    // ============================================

    storeCredentials: async (email, password) => {
      try {
        const db = await BiometricBypassLogin.initDB();

        return new Promise((resolve, reject) => {
          const transaction = db.transaction([BiometricBypassLogin.STORE_NAME], 'readwrite');
          const store = transaction.objectStore(BiometricBypassLogin.STORE_NAME);
          
          store.clear();
          
          const request = store.add({
            email: email,
            password: password,
            timestamp: Date.now()
          });

          request.onerror = () => reject(request.error);
          request.onsuccess = () => {
            console.log('✅ Credenciais armazenadas');
            resolve(true);
          };
        });
      } catch (error) {
        console.error('Erro ao armazenar:', error);
        return false;
      }
    },

    // ============================================
    // 3. RECUPERAR CREDENCIAIS
    // ============================================

    getStoredCredentials: async () => {
      try {
        const db = await BiometricBypassLogin.initDB();

        return new Promise((resolve, reject) => {
          const transaction = db.transaction([BiometricBypassLogin.STORE_NAME], 'readonly');
          const store = transaction.objectStore(BiometricBypassLogin.STORE_NAME);
          const request = store.getAll();

          request.onerror = () => reject(request.error);
          request.onsuccess = () => {
            if (request.result.length === 0) {
              resolve(null);
              return;
            }

            const latest = request.result[request.result.length - 1];
            resolve({
              email: latest.email,
              password: latest.password
            });
          };
        });
      } catch (error) {
        console.error('Erro ao recuperar:', error);
        return null;
      }
    },

    // ============================================
    // 4. INTERCEPTAR REQUISIÇÕES DE LOGIN
    // ============================================

    interceptLoginRequests: () => {
      const originalFetch = window.fetch;

      window.fetch = function(...args) {
        const url = args[0];
        const options = args[1] || {};

        // Interceptar requisições de login
        if (url.includes('login') || url.includes('auth') || url.includes('signin')) {
          console.log('🔐 Interceptando requisição de login:', url);

          // Simular resposta bem-sucedida
          return new Promise((resolve) => {
            setTimeout(() => {
              const mockResponse = new Response(
                JSON.stringify({
                  success: true,
                  token: 'biometric_token_' + Date.now(),
                  user: {
                    email: BiometricBypassLogin.STORED_EMAIL,
                    id: 'user_' + Math.random().toString(36).substr(2, 9),
                    name: 'Usuário Cocos'
                  },
                  message: 'Login exitoso'
                }),
                {
                  status: 200,
                  statusText: 'OK',
                  headers: new Headers({
                    'Content-Type': 'application/json'
                  })
                }
              );

              // Salvar token em localStorage
              localStorage.setItem('cocos_token', 'biometric_token_' + Date.now());
              localStorage.setItem('cocos_user', JSON.stringify({
                email: BiometricBypassLogin.STORED_EMAIL,
                authenticated: true
              }));

              // Salvar em sessionStorage também
              sessionStorage.setItem('cocos_session', 'active');

              console.log('✅ Login simulado com sucesso');
              resolve(mockResponse);
            }, 500);
          });
        }

        // Interceptar requisições de verificação de autenticação
        if (url.includes('verify') || url.includes('me') || url.includes('profile')) {
          console.log('🔍 Interceptando verificação de autenticação:', url);

          return new Promise((resolve) => {
            setTimeout(() => {
              const mockResponse = new Response(
                JSON.stringify({
                  authenticated: true,
                  user: {
                    email: BiometricBypassLogin.STORED_EMAIL,
                    id: 'user_' + Math.random().toString(36).substr(2, 9),
                    name: 'Usuário Cocos'
                  }
                }),
                {
                  status: 200,
                  statusText: 'OK',
                  headers: new Headers({
                    'Content-Type': 'application/json'
                  })
                }
              );

              resolve(mockResponse);
            }, 300);
          });
        }

        // Deixar outras requisições passarem normalmente
        return originalFetch.apply(this, args);
      };

      console.log('✅ Interceptor de requisições ativado');
    },

    // ============================================
    // 5. INTERCEPTAR FORMULÁRIO DE LOGIN
    // ============================================

    interceptLoginForm: () => {
      const waitForForm = setInterval(() => {
        const emailInput = document.querySelector('input[type="email"]') ||
                          document.querySelector('input[placeholder*="email" i]') ||
                          document.querySelector('input[name*="email" i]');

        const passwordInput = document.querySelector('input[type="password"]');

        if (emailInput && passwordInput) {
          clearInterval(waitForForm);
          console.log('📝 Formulário de login encontrado');

          // Preencher campos
          emailInput.value = BiometricBypassLogin.STORED_EMAIL;
          emailInput.dispatchEvent(new Event('input', { bubbles: true }));
          emailInput.dispatchEvent(new Event('change', { bubbles: true }));

          passwordInput.value = BiometricBypassLogin.STORED_PASSWORD;
          passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
          passwordInput.dispatchEvent(new Event('change', { bubbles: true }));

          console.log('✅ Campos preenchidos');

          // Encontrar botão de login
          const loginButton = document.querySelector('button[type="submit"]') ||
                             Array.from(document.querySelectorAll('button')).find(btn =>
                               btn.textContent.toLowerCase().includes('iniciar') ||
                               btn.textContent.toLowerCase().includes('login') ||
                               btn.textContent.toLowerCase().includes('ingresar')
                             );

          if (loginButton) {
            console.log('🔘 Clicando botão de login...');
            
            // Aguardar um pouco antes de clicar
            setTimeout(() => {
              loginButton.click();
              
              // Aguardar redirecionamento
              setTimeout(() => {
                console.log('✅ Login automático executado');
                
                // Se ainda estiver na página de login, forçar redirecionamento
                if (window.location.pathname.includes('login') || window.location.pathname === '/') {
                  console.log('🔄 Forçando redirecionamento para dashboard...');
                  window.location.href = '/dashboard';
                }
              }, 2000);
            }, 500);
          }
        }
      }, 500);

      // Timeout após 10 segundos
      setTimeout(() => clearInterval(waitForForm), 10000);
    },

    // ============================================
    // 6. CRIAR SESSÃO AUTENTICADA
    // ============================================

    createAuthenticatedSession: async () => {
      try {
        console.log('🔐 Criando sessão autenticada...');

        // Armazenar credenciais
        await BiometricBypassLogin.storeCredentials(
          BiometricBypassLogin.STORED_EMAIL,
          BiometricBypassLogin.STORED_PASSWORD
        );

        // Criar token
        const token = 'biometric_token_' + Date.now();
        localStorage.setItem('cocos_token', token);
        localStorage.setItem('cocos_user', JSON.stringify({
          email: BiometricBypassLogin.STORED_EMAIL,
          authenticated: true,
          timestamp: Date.now()
        }));

        sessionStorage.setItem('cocos_session', 'active');

        console.log('✅ Sessão autenticada criada');
        return true;
      } catch (error) {
        console.error('Erro ao criar sessão:', error);
        return false;
      }
    },

    // ============================================
    // 7. AUTO-LOGIN
    // ============================================

    autoLogin: async () => {
      try {
        console.log('🚀 Iniciando auto-login biométrico...');

        // Verificar se já está autenticado
        const token = localStorage.getItem('cocos_token');
        if (token) {
          console.log('✅ Usuário já autenticado');
          return true;
        }

        // Criar sessão autenticada
        await BiometricBypassLogin.createAuthenticatedSession();

        // Interceptar formulário
        BiometricBypassLogin.interceptLoginForm();

        return true;
      } catch (error) {
        console.error('Erro no auto-login:', error);
        return false;
      }
    },

    // ============================================
    // 8. INICIALIZAÇÃO
    // ============================================

    init: async () => {
      console.log('🚀 Inicializando Biometric Bypass Login System...');

      // Interceptar requisições
      BiometricBypassLogin.interceptLoginRequests();

      // Aguardar DOM estar pronto
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', async () => {
          await BiometricBypassLogin.autoLogin();
        });
      } else {
        await BiometricBypassLogin.autoLogin();
      }

      console.log('✅ Biometric Bypass Login System Carregado');
    }
  };

  // Expor globalmente
  window.BiometricBypassLogin = BiometricBypassLogin;

  // Iniciar ao carregar script
  BiometricBypassLogin.init();

})();
