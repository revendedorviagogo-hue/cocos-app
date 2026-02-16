import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';

/**
 * COCOS APP - PLATAFORMA DE INVESTIMENTOS COMPLETA
 * 
 * Esta página carrega a aplicação Cocos original compilada com TODAS as funcionalidades:
 * - Login e autenticação
 * - Portfólio de investimentos
 * - Mercado (ações, ETFs, fundos)
 * - Criptografia
 * - Cartão de débito
 * - PIX e transferências
 * - Gráficos avançados (Charting Library)
 * - PWA com suporte offline
 * 
 * Todos os assets (JS, CSS, Charting Library) estão em /public/assets/
 * A aplicação é uma PWA completa com suporte offline.
 */
export default function Home() {
  const { isAuthenticated } = useAuth();
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const linkRef = useRef<HTMLLinkElement | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    // Carregar o script principal da aplicação Cocos
    const script = document.createElement('script');
    script.src = '/assets/index-Dh3SBaGN.js';
    script.type = 'module';
    script.crossOrigin = 'anonymous';
    script.async = true;
    document.body.appendChild(script);
    scriptRef.current = script;

    // Carregar o CSS principal
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/assets/index-CGdD2EAY.css';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
    linkRef.current = link;

    // Registrar o Service Worker se disponível
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/mockServiceWorker.js', { scope: '/' })
        .then((registration) => {
          console.log('Service Worker registrado:', registration);
        })
        .catch((err) => {
          console.log('Service Worker registration failed:', err);
        });
    }

    // Registrar Facebook Pixel
    if ((window as any).fbq) {
      (window as any).fbq('track', 'PageView');
    }

    return () => {
      // Cleanup
      if (scriptRef.current?.parentNode) {
        scriptRef.current.parentNode.removeChild(scriptRef.current);
      }
      if (linkRef.current?.parentNode) {
        linkRef.current.parentNode.removeChild(linkRef.current);
      }
    };
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <p className="text-gray-600">Redirecionando para login...</p>
        </div>
      </div>
    );
  }

  return (
    <div id="cocos-app" style={{ width: '100%', height: '100vh', overflow: 'hidden' }}>
      {/* A aplicação Cocos será renderizada aqui */}
    </div>
  );
}
