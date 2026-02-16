import { useCallback, useState } from 'react';
import { cocosAPI, PaymentResponse } from '@/lib/api';

export interface PaymentState {
  payment: PaymentResponse | null;
  isLoading: boolean;
  error: string | null;
  status: 'idle' | 'creating' | 'confirming' | 'processing' | 'completed' | 'failed';
}

export const usePayment = () => {
  const [state, setState] = useState<PaymentState>({
    payment: null,
    isLoading: false,
    error: null,
    status: 'idle',
  });

  const createPayment = useCallback(
    async (data: {
      quantity: number;
      currency: string;
      businessName: string;
      paymentType: string;
      transactionCurrency: string;
      description?: string;
    }) => {
      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
        status: 'creating',
      }));

      try {
        const payment = await cocosAPI.createPayment(data);
        setState((prev) => ({
          ...prev,
          payment,
          isLoading: false,
          status: 'confirming',
        }));
        return payment;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erro ao criar pagamento';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
          status: 'failed',
        }));
        throw err;
      }
    },
    []
  );

  const getPaymentMethods = useCallback(async (paymentId: string, quantity: number) => {
    try {
      const methods = await cocosAPI.getPaymentMethods(paymentId, quantity);
      return methods;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro ao obter métodos de pagamento';
      setState((prev) => ({
        ...prev,
        error: errorMessage,
      }));
      throw err;
    }
  }, []);

  const confirmPaymentMethod = useCallback(
    async (paymentId: string, method: string, quantity?: number) => {
      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
        status: 'confirming',
      }));

      try {
        const payment = await cocosAPI.confirmPaymentMethod(paymentId, method, quantity);
        setState((prev) => ({
          ...prev,
          payment,
          isLoading: false,
          status: 'processing',
        }));
        return payment;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erro ao confirmar método de pagamento';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
          status: 'failed',
        }));
        throw err;
      }
    },
    []
  );

  const checkPaymentStatus = useCallback(async (paymentId: string) => {
    try {
      const payment = await cocosAPI.getPaymentStatus(paymentId);
      setState((prev) => ({
        ...prev,
        payment,
        status: payment.status === 'COMPLETED' ? 'completed' : 'processing',
      }));
      return payment;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro ao verificar status do pagamento';
      setState((prev) => ({
        ...prev,
        error: errorMessage,
      }));
      throw err;
    }
  }, []);

  const getQRCode = useCallback(async (paymentId: string) => {
    try {
      const qrCode = await cocosAPI.getQRCode(paymentId, 'png');
      return qrCode;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro ao obter QR code';
      setState((prev) => ({
        ...prev,
        error: errorMessage,
      }));
      throw err;
    }
  }, []);

  const pollPaymentStatus = useCallback(
    async (paymentId: string, maxAttempts = 30, interval = 2000) => {
      let attempts = 0;

      return new Promise((resolve, reject) => {
        const timer = setInterval(async () => {
          attempts++;

          try {
            const payment = await checkPaymentStatus(paymentId);

            if (payment.status === 'COMPLETED') {
              clearInterval(timer);
              setState((prev) => ({
                ...prev,
                status: 'completed',
              }));
              resolve(payment);
            } else if (payment.status === 'FAILED') {
              clearInterval(timer);
              setState((prev) => ({
                ...prev,
                status: 'failed',
                error: 'Pagamento falhou',
              }));
              reject(new Error('Pagamento falhou'));
            } else if (attempts >= maxAttempts) {
              clearInterval(timer);
              setState((prev) => ({
                ...prev,
                status: 'failed',
                error: 'Timeout ao aguardar confirmação',
              }));
              reject(new Error('Timeout'));
            }
          } catch (err) {
            clearInterval(timer);
            reject(err);
          }
        }, interval);
      });
    },
    [checkPaymentStatus]
  );

  const reset = useCallback(() => {
    setState({
      payment: null,
      isLoading: false,
      error: null,
      status: 'idle',
    });
  }, []);

  return {
    ...state,
    createPayment,
    getPaymentMethods,
    confirmPaymentMethod,
    checkPaymentStatus,
    getQRCode,
    pollPaymentStatus,
    reset,
  };
};
