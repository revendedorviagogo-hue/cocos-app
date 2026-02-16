import { useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { TrendingUp, Send, Wallet, CreditCard, Settings, LogOut, Camera, Share2, Smartphone } from 'lucide-react';
import { usePlatformContext } from '@/contexts/PlatformContext';

/**
 * COCOS APP - DASHBOARD PRINCIPAL
 * 
 * Esta página exibe o dashboard com:
 * - Saldo total e ganhos
 * - Portfólio resumido
 * - Ações rápidas (PIX, Transferências, etc)
 * - Menu de navegação
 */
export default function Home() {
  const { isAuthenticated, user, logout } = useAuth();
  const [, navigate] = useLocation();
  const platform = usePlatformContext();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Registrar Facebook Pixel
    if ((window as any).fbq) {
      (window as any).fbq('track', 'PageView');
    }

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
  }, [isAuthenticated, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-indigo-600">Cocos</h1>
              {platform.isNative && (
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-600 flex items-center gap-1">
                  <Smartphone className="w-3 h-3" />
                  {platform.isAndroid ? 'Android' : 'iOS'}
                </span>
              )}
              {platform.isMobile && !platform.isNative && (
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
                  Mobile Web
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600">Bem-vindo, {user?.name || 'Usuário'}!</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Saldo */}
        <Card className="p-8 mb-8 bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
          <div className="mb-4">
            <p className="text-indigo-100 text-sm font-medium">Saldo Total</p>
            <h2 className="text-4xl font-bold mt-2">R$ 15.250,50</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div>
              <p className="text-indigo-100 text-sm">Disponível</p>
              <p className="text-xl font-semibold mt-1">R$ 12.500,00</p>
            </div>
            <div>
              <p className="text-indigo-100 text-sm">Investido</p>
              <p className="text-xl font-semibold mt-1">R$ 2.750,50</p>
            </div>
          </div>
        </Card>

        {/* Ações Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Button
            onClick={() => navigate('/pix')}
            className="h-24 flex flex-col items-center justify-center gap-2 bg-white text-indigo-600 hover:bg-indigo-50 border-2 border-indigo-200"
          >
            <Send className="w-6 h-6" />
            <span>PIX</span>
          </Button>

          <Button
            onClick={() => navigate('/portfolio')}
            className="h-24 flex flex-col items-center justify-center gap-2 bg-white text-indigo-600 hover:bg-indigo-50 border-2 border-indigo-200"
          >
            <Wallet className="w-6 h-6" />
            <span>Portfólio</span>
          </Button>

          <Button
            onClick={() => navigate('/market')}
            className="h-24 flex flex-col items-center justify-center gap-2 bg-white text-indigo-600 hover:bg-indigo-50 border-2 border-indigo-200"
          >
            <TrendingUp className="w-6 h-6" />
            <span>Mercado</span>
          </Button>

          <Button
            onClick={() => navigate('/card')}
            className="h-24 flex flex-col items-center justify-center gap-2 bg-white text-indigo-600 hover:bg-indigo-50 border-2 border-indigo-200"
          >
            <CreditCard className="w-6 h-6" />
            <span>Cartão</span>
          </Button>

          {/* Opções Mobile - Somente em apps nativos */}
          {platform.isNative && (
            <>
              <Button
                onClick={() => {
                  // TODO: Implementar câmera
                  alert('Câmera - Disponível em ' + (platform.isAndroid ? 'Android' : 'iOS'));
                }}
                className="h-24 flex flex-col items-center justify-center gap-2 bg-white text-indigo-600 hover:bg-indigo-50 border-2 border-indigo-200"
              >
                <Camera className="w-6 h-6" />
                <span>Câmera</span>
              </Button>

              <Button
                onClick={() => {
                  // TODO: Implementar compartilhar
                  alert('Compartilhar - Disponível em ' + (platform.isAndroid ? 'Android' : 'iOS'));
                }}
                className="h-24 flex flex-col items-center justify-center gap-2 bg-white text-indigo-600 hover:bg-indigo-50 border-2 border-indigo-200"
              >
                <Share2 className="w-6 h-6" />
                <span>Compartilhar</span>
              </Button>
            </>
          )}
        </div>

        {/* Portfólio Resumido */}
        <Card className="p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            Meu Portfólio
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-semibold text-gray-800">PETR4</p>
                <p className="text-sm text-gray-600">Petrobras - 100 ações</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-800">R$ 2.875,00</p>
                <p className="text-sm text-green-600">+12,76%</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-semibold text-gray-800">BTC</p>
                <p className="text-sm text-gray-600">Bitcoin - 0.05 BTC</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-800">R$ 4.750,00</p>
                <p className="text-sm text-green-600">+8,32%</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-semibold text-gray-800">ETH</p>
                <p className="text-sm text-gray-600">Ethereum - 0.5 ETH</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-800">R$ 1.750,00</p>
                <p className="text-sm text-green-600">+5,12%</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Transações Recentes */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Transações Recentes</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border-b">
              <div>
                <p className="font-semibold text-gray-800">Depósito via PIX</p>
                <p className="text-sm text-gray-600">15 de fevereiro</p>
              </div>
              <p className="font-semibold text-green-600">+R$ 1.000,00</p>
            </div>

            <div className="flex items-center justify-between p-3 border-b">
              <div>
                <p className="font-semibold text-gray-800">Compra PETR4</p>
                <p className="text-sm text-gray-600">14 de fevereiro</p>
              </div>
              <p className="font-semibold text-red-600">-R$ 500,00</p>
            </div>

            <div className="flex items-center justify-between p-3">
              <div>
                <p className="font-semibold text-gray-800">Transferência para João</p>
                <p className="text-sm text-gray-600">13 de fevereiro</p>
              </div>
              <p className="font-semibold text-red-600">-R$ 250,00</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
