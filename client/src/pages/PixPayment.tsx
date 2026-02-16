import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { usePayment } from '@/hooks/usePayment';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Copy, CheckCircle, AlertCircle } from 'lucide-react';

export default function PixPayment() {
  const { user } = useAuth();
  const {
    payment,
    isLoading,
    error,
    status,
    createPayment,
    confirmPaymentMethod,
    pollPaymentStatus,
    reset,
  } = usePayment();

  const [amount, setAmount] = useState('');
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || parseFloat(amount) <= 0) {
      alert('Digite um valor válido');
      return;
    }

    try {
      const paymentData = await createPayment({
        quantity: parseFloat(amount),
        currency: 'BRL',
        businessName: 'Cocos Capital',
        paymentType: 'OPEN',
        transactionCurrency: 'BRL',
        description: 'Depósito para investimento',
      });

      // Confirmar método PIX
      await confirmPaymentMethod(paymentData.idPayment, 'pix', parseFloat(amount));

      // Iniciar polling
      try {
        await pollPaymentStatus(paymentData.idPayment);
      } catch (err) {
        console.error('Polling error:', err);
      }
    } catch (err) {
      console.error('Payment error:', err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    reset();
    setAmount('');
    setShowQR(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-4">
          <h1 className="text-2xl font-bold text-indigo-600">PIX</h1>
          <p className="text-gray-600 text-sm mt-2">Transferência instantânea</p>
        </div>

        {/* Estado: Criando Pagamento */}
        {status === 'idle' || status === 'creating' ? (
          <Card className="p-6 shadow-lg">
            <form onSubmit={handleCreatePayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor (R$)
                </label>
                <Input
                  type="number"
                  placeholder="100,00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isLoading}
                  step="0.01"
                  min="0"
                  className="w-full"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm flex gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading || !amount}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isLoading ? 'Gerando...' : 'Gerar PIX'}
              </Button>
            </form>
          </Card>
        ) : null}

        {/* Estado: Aguardando Pagamento */}
        {status === 'processing' && payment ? (
          <Card className="p-6 shadow-lg space-y-6">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">
                Escaneie o QR Code
              </h2>
              <p className="text-gray-600 text-sm">
                Ou copie a chave PIX abaixo
              </p>
            </div>

            {/* QR Code */}
            {showQR && payment.qrCode ? (
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <img
                  src={`data:image/png;base64,${payment.qrCode.data}`}
                  alt="QR Code PIX"
                  className="w-full"
                />
              </div>
            ) : (
              <Button
                onClick={() => setShowQR(true)}
                variant="outline"
                className="w-full"
              >
                Mostrar QR Code
              </Button>
            )}

            {/* Chave PIX */}
            {payment.qrCode && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-600 mb-2 font-semibold">
                  CHAVE PIX
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={payment.qrCode.key}
                    readOnly
                    className="flex-1 bg-white border border-gray-300 rounded px-3 py-2 text-sm font-mono"
                  />
                  <Button
                    onClick={() => copyToClipboard(payment.qrCode!.key)}
                    size="sm"
                    variant="outline"
                    className="flex-shrink-0"
                  >
                    {copied ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Informações */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>Valor:</strong> R$ {payment.quantity.toFixed(2)}
              </p>
              <p className="text-sm text-blue-900 mt-1">
                <strong>Expira em:</strong> 15 minutos
              </p>
            </div>

            {/* Status */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-indigo-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm font-semibold">
                  Aguardando confirmação...
                </span>
              </div>
            </div>
          </Card>
        ) : null}

        {/* Estado: Pagamento Completo */}
        {status === 'completed' && payment ? (
          <Card className="p-6 shadow-lg space-y-6">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-800">
                Pagamento Confirmado!
              </h2>
              <p className="text-gray-600 text-sm mt-2">
                Sua transação foi processada com sucesso
              </p>
            </div>

            {/* Detalhes */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Valor:</span>
                <span className="font-semibold">R$ {payment.quantity.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">ID:</span>
                <span className="font-mono text-sm">{payment.idPayment}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="text-green-600 font-semibold">Concluído</span>
              </div>
            </div>

            <Button
              onClick={handleReset}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg"
            >
              Fazer Novo PIX
            </Button>
          </Card>
        ) : null}

        {/* Estado: Erro */}
        {status === 'failed' ? (
          <Card className="p-6 shadow-lg space-y-6">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-800">
                Erro no Pagamento
              </h2>
              <p className="text-gray-600 text-sm mt-2">{error}</p>
            </div>

            <Button
              onClick={handleReset}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg"
            >
              Tentar Novamente
            </Button>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
