import { useEffect } from 'react';

/**
 * Cocos App - Plataforma de Investimentos
 * 
 * Esta página carrega a aplicação Cocos original compilada.
 * Todos os assets (JS, CSS) estão em /public/assets/
 * A aplicação é uma PWA completa com suporte offline.
 */
export default function Home() {
  useEffect(() => {
    // Carregar o script principal da aplicação Cocos
    const script = document.createElement('script');
    script.src = '/assets/index-Dh3SBaGN.js';
    script.type = 'module';
    script.crossOrigin = 'anonymous';
    document.body.appendChild(script);

    // Carregar o CSS principal
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/assets/index-CGdD2EAY.css';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);

    // Registrar o Service Worker se disponível
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/mockServiceWorker.js', { scope: '/' }).catch(err => {
        console.log('Service Worker registration failed:', err);
      });
    }

    return () => {
      // Cleanup
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
    };
  }, []);

  return (
    <div id="cocos-app" style={{ width: '100%', height: '100vh' }}>
      {/* A aplicação Cocos será renderizada aqui */}
    </div>
  );
}
