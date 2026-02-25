/**
 * BIOMETRIC AUTHENTICATION SYSTEM
 * 
 * Sistema completo de autenticação biométrica com:
 * - Registro de credenciais no primeiro login
 * - Armazenamento seguro em IndexedDB
 * - Login automático com WebAuthn (fingerprint/face)
 * - Sem necessidade de OTP ou 2FA
 */

(function() {
  'use strict';

  // ============================================
  // 1. CONFIGURAÇÃO E INICIALIZAÇÃO
  // ============================================

  const BiometricAuth = {
    // Verificar suporte a WebAuthn
    isSupported: () => {
      return window.PublicKeyCredential !== undefined &&
             navigator.credentials !== undefined;
    },

    // Verificar se plataforma suporta biometria
    isPlatformAuthenticatorAvailable: async () => {
      if (!BiometricAuth.isSupported()) return false;
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    },

    // Gerar challenge aleatório
    generateChallenge: () => {
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      return array;
    },

    // Converter ArrayBuffer para Base64
    arrayBufferToBase64: (buffer) => {
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    },

    // Converter Base64 para ArrayBuffer
    base64ToArrayBuffer: (base64) => {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes.buffer;
    },

    // Criptografar dados com senha
    encryptData: async (data, password) => {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(JSON.stringify(data));
      
      // Gerar salt aleatório
      const salt = crypto.getRandomValues(new Uint8Array(16));
      
      // Derivar chave da senha
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
      );

      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
      );

      // Gerar IV aleatório
      const iv = crypto.getRandomValues(new Uint8Array(12));

      // Criptografar dados
      const encryptedData = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        dataBuffer
      );

      // Retornar salt + iv + encrypted data em Base64
      const result = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
      result.set(salt, 0);
      result.set(iv, salt.length);
      result.set(new Uint8Array(encryptedData), salt.length + iv.length);

      return BiometricAuth.arrayBufferToBase64(result.buffer);
    },

    // Descriptografar dados com senha
    decryptData: async (encryptedBase64, password) => {
      const encoder = new TextEncoder();
      const encryptedBuffer = BiometricAuth.base64ToArrayBuffer(encryptedBase64);
      const encryptedArray = new Uint8Array(encryptedBuffer);

      // Extrair salt, iv e dados criptografados
      const salt = encryptedArray.slice(0, 16);
      const iv = encryptedArray.slice(16, 28);
      const encryptedData = encryptedArray.slice(28);

      // Derivar chave da senha
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
      );

      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      );

      // Descriptografar
      const decryptedData = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        encryptedData
      );

      const decoder = new TextDecoder();
      return JSON.parse(decoder.decode(decryptedData));
    },

    // ============================================
    // 2. REGISTRO DE CREDENCIAIS BIOMÉTRICAS
    // ============================================

    registerBiometric: async (email, password) => {
      try {
        if (!await BiometricAuth.isPlatformAuthenticatorAvailable()) {
          console.warn('Biometria não disponível neste dispositivo');
          return false;
        }

        // Criar credencial WebAuthn
        const challenge = BiometricAuth.generateChallenge();
        const userId = new TextEncoder().encode(email);

        const credentialCreationOptions = {
          challenge: challenge,
          rp: {
            name: 'Cocos - Plataforma de Investimentos',
            id: window.location.hostname
          },
          user: {
            id: userId,
            name: email,
            displayName: email
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' },  // ES256
            { alg: -257, type: 'public-key' } // RS256
          ],
          timeout: 60000,
          attestation: 'direct',
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'preferred',
            residentKey: 'preferred'
          }
        };

        // Registrar credencial
        const credential = await navigator.credentials.create({
          publicKey: credentialCreationOptions
        });

        if (!credential) {
          console.error('Falha ao criar credencial biométrica');
          return false;
        }

        // Criptografar credenciais
        const credentialsData = {
          email: email,
          password: password,
          credentialId: BiometricAuth.arrayBufferToBase64(credential.id),
          publicKey: BiometricAuth.arrayBufferToBase64(credential.response.getPublicKey()),
          attestationObject: BiometricAuth.arrayBufferToBase64(credential.response.attestationObject),
          clientDataJSON: BiometricAuth.arrayBufferToBase64(credential.response.clientDataJSON),
          registeredAt: new Date().toISOString()
        };

        // Armazenar em IndexedDB
        await BiometricAuth.storeCredentials(credentialsData, password);

        console.log('✅ Biometria registrada com sucesso');
        return true;

      } catch (error) {
        console.error('Erro ao registrar biometria:', error);
        return false;
      }
    },

    // ============================================
    // 3. ARMAZENAMENTO SEGURO EM INDEXEDDB
    // ============================================

    initDatabase: async () => {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open('CocosAuth', 1);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains('credentials')) {
            db.createObjectStore('credentials', { keyPath: 'email' });
          }
          if (!db.objectStoreNames.contains('sessions')) {
            db.createObjectStore('sessions', { keyPath: 'email' });
          }
        };
      });
    },

    storeCredentials: async (credentialsData, encryptionPassword) => {
      const db = await BiometricAuth.initDatabase();
      const encrypted = await BiometricAuth.encryptData(credentialsData, encryptionPassword);

      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['credentials'], 'readwrite');
        const store = transaction.objectStore('credentials');
        const request = store.put({
          email: credentialsData.email,
          encryptedData: encrypted,
          timestamp: Date.now()
        });

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          console.log('✅ Credenciais armazenadas com segurança');
          resolve(true);
        };
      });
    },

    getStoredCredentials: async (email, password) => {
      const db = await BiometricAuth.initDatabase();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['credentials'], 'readonly');
        const store = transaction.objectStore('credentials');
        const request = store.get(email);

        request.onerror = () => reject(request.error);
        request.onsuccess = async () => {
          if (!request.result) {
            resolve(null);
            return;
          }

          try {
            const decrypted = await BiometricAuth.decryptData(
              request.result.encryptedData,
              password
            );
            resolve(decrypted);
          } catch (error) {
            console.error('Erro ao descriptografar credenciais:', error);
            resolve(null);
          }
        };
      });
    },

    // ============================================
    // 4. LOGIN COM BIOMETRIA
    // ============================================

    authenticateWithBiometric: async (email) => {
      try {
        if (!await BiometricAuth.isPlatformAuthenticatorAvailable()) {
          console.warn('Biometria não disponível');
          return null;
        }

        // Recuperar credenciais armazenadas
        const db = await BiometricAuth.initDatabase();
        const credentialsData = await new Promise((resolve, reject) => {
          const transaction = db.transaction(['credentials'], 'readonly');
          const store = transaction.objectStore('credentials');
          const request = store.get(email);

          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve(request.result);
        });

        if (!credentialsData) {
          console.error('Nenhuma credencial biométrica encontrada para este email');
          return null;
        }

        // Criar assertion com WebAuthn
        const challenge = BiometricAuth.generateChallenge();
        const credentialId = BiometricAuth.base64ToArrayBuffer(
          JSON.parse(atob(credentialsData.encryptedData.split('.')[0])).credentialId
        );

        const assertionOptions = {
          challenge: challenge,
          timeout: 60000,
          userVerification: 'preferred',
          allowCredentials: [{
            id: credentialId,
            type: 'public-key',
            transports: ['internal']
          }]
        };

        const assertion = await navigator.credentials.get({
          publicKey: assertionOptions
        });

        if (!assertion) {
          console.error('Autenticação biométrica cancelada');
          return null;
        }

        // Retornar dados de autenticação
        return {
          email: email,
          authenticatorData: BiometricAuth.arrayBufferToBase64(assertion.response.authenticatorData),
          clientDataJSON: BiometricAuth.arrayBufferToBase64(assertion.response.clientDataJSON),
          signature: BiometricAuth.arrayBufferToBase64(assertion.response.signature),
          userHandle: assertion.response.userHandle ? BiometricAuth.arrayBufferToBase64(assertion.response.userHandle) : null
        };

      } catch (error) {
        console.error('Erro na autenticação biométrica:', error);
        return null;
      }
    },

    // ============================================
    // 5. AUTO-LOGIN COM BIOMETRIA
    // ============================================

    autoLoginWithBiometric: async () => {
      try {
        // Verificar se há sessão ativa
        const db = await BiometricAuth.initDatabase();
        const sessions = await new Promise((resolve, reject) => {
          const transaction = db.transaction(['sessions'], 'readonly');
          const store = transaction.objectStore('sessions');
          const request = store.getAll();

          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve(request.result);
        });

        if (sessions.length === 0) {
          console.log('Nenhuma sessão anterior encontrada');
          return false;
        }

        const lastSession = sessions[sessions.length - 1];
        const email = lastSession.email;

        console.log('🔐 Tentando auto-login com biometria para:', email);

        // Autenticar com biometria
        const authData = await BiometricAuth.authenticateWithBiometric(email);

        if (!authData) {
          console.error('Falha na autenticação biométrica');
          return false;
        }

        // Enviar para servidor para validação
        const response = await fetch('/api/auth/biometric-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(authData),
          credentials: 'include'
        });

        if (!response.ok) {
          console.error('Falha no login biométrico no servidor');
          return false;
        }

        const result = await response.json();

        if (result.success) {
          console.log('✅ Login biométrico bem-sucedido');
          // Redirecionar para dashboard
          window.location.href = '/dashboard';
          return true;
        }

        return false;

      } catch (error) {
        console.error('Erro no auto-login biométrico:', error);
        return false;
      }
    },

    // ============================================
    // 6. GERENCIAMENTO DE SESSÕES
    // ============================================

    saveSession: async (email, password) => {
      const db = await BiometricAuth.initDatabase();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['sessions'], 'readwrite');
        const store = transaction.objectStore('sessions');
        const request = store.put({
          email: email,
          timestamp: Date.now(),
          lastLogin: new Date().toISOString()
        });

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          console.log('✅ Sessão salva');
          resolve(true);
        };
      });
    },

    clearSession: async (email) => {
      const db = await BiometricAuth.initDatabase();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['sessions'], 'readwrite');
        const store = transaction.objectStore('sessions');
        const request = store.delete(email);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          console.log('✅ Sessão removida');
          resolve(true);
        };
      });
    }
  };

  // ============================================
  // 7. INTEGRAÇÃO COM LOGIN FORM
  // ============================================

  // Expor globalmente
  window.BiometricAuth = BiometricAuth;

  // Auto-login ao carregar página
  document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔐 Sistema de Autenticação Biométrica Carregado');
    
    // Tentar auto-login se suportado
    if (BiometricAuth.isSupported()) {
      const autoLoginAttempted = await BiometricAuth.autoLoginWithBiometric();
      if (!autoLoginAttempted) {
        console.log('Auto-login não disponível, aguardando login manual');
      }
    } else {
      console.warn('⚠️ WebAuthn não suportado neste navegador');
    }
  });

  // Interceptar formulário de login
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      const loginForm = document.querySelector('form');
      if (loginForm) {
        const originalSubmit = loginForm.onsubmit;
        
        loginForm.addEventListener('submit', async (e) => {
          const emailInput = loginForm.querySelector('input[type="email"]') || 
                           loginForm.querySelector('input[placeholder*="email" i]') ||
                           loginForm.querySelector('input[name*="email" i]');
          const passwordInput = loginForm.querySelector('input[type="password"]');

          if (emailInput && passwordInput) {
            const email = emailInput.value;
            const password = passwordInput.value;

            // Registrar biometria após login bem-sucedido
            if (email && password) {
              console.log('📱 Registrando biometria para:', email);
              
              setTimeout(async () => {
                const registered = await BiometricAuth.registerBiometric(email, password);
                if (registered) {
                  await BiometricAuth.saveSession(email, password);
                  console.log('✅ Biometria ativada para próximos logins');
                }
              }, 2000);
            }
          }
        });
      }
    }, 1000);
  });

})();
