import axios, { AxiosInstance, AxiosError } from 'axios';
import { Preferences } from '@capacitor/preferences';
import { Device } from '@capacitor/device';

// Tipos
export interface ApiConfig {
  baseURL: string;
  timeout: number;
  headers: Record<string, string>;
}

export interface LoginResponse {
  success: boolean;
  data: {
    token: string;
    refreshToken: string;
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      phone: string;
      status: string;
      kycStatus: string;
      twoFactorEnabled: boolean;
    };
    expiresIn: number;
  };
}

export interface PaymentResponse {
  idPayment: string;
  status: string;
  quantity: number;
  currency: string;
  createdAt: string;
  expiresAt: string;
  businessName: string;
  qrCode?: {
    url: string;
    data: string;
    key: string;
    keyType: string;
    expiresIn: number;
  };
}

// Classe API
class CocoAPI {
  private api: AxiosInstance;
  private token: string | null = null;
  private refreshToken: string | null = null;
  private deviceInfo: any = null;

  constructor() {
    this.api = axios.create({
      baseURL: 'https://api.cocos.capital',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      },
    });

    // Interceptor para adicionar token
    this.api.interceptors.request.use(async (config) => {
      const token = await this.getStoredToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Adicionar info do dispositivo
      if (!this.deviceInfo) {
        this.deviceInfo = await Device.getInfo();
      }

      config.headers['User-Agent'] = this.getUserAgent();
      config.headers['X-Device-ID'] = this.deviceInfo.identifier;
      config.headers['X-Platform'] = this.deviceInfo.platform;

      return config;
    });

    // Interceptor para tratamento de erros
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expirado, tentar refresh
          const refreshed = await this.refreshAccessToken();
          if (refreshed) {
            return this.api.request(error.config!);
          } else {
            // Logout
            await this.logout();
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Autenticação
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await axios.post<LoginResponse>(
        'https://auth.cocos.capital/login',
        { email, password },
        {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': this.getUserAgent(),
          },
        }
      );

      if (response.data.data.token) {
        this.token = response.data.data.token;
        this.refreshToken = response.data.data.refreshToken;

        // Salvar tokens no storage seguro
        await Preferences.set({
          key: 'auth_token',
          value: this.token,
        });
        await Preferences.set({
          key: 'refresh_token',
          value: this.refreshToken,
        });
      }

      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    await Preferences.remove({ key: 'auth_token' });
    await Preferences.remove({ key: 'refresh_token' });
    this.token = null;
    this.refreshToken = null;
  }

  async refreshAccessToken(): Promise<boolean> {
    try {
      const refreshToken = await this.getStoredRefreshToken();
      if (!refreshToken) return false;

      const response = await axios.post<LoginResponse>(
        'https://auth.cocos.capital/refresh-token',
        { refreshToken },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.data.token) {
        this.token = response.data.data.token;
        await Preferences.set({
          key: 'auth_token',
          value: this.token,
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Refresh token error:', error);
      return false;
    }
  }

  // Pagamentos
  async createPayment(data: {
    quantity: number;
    currency: string;
    businessName: string;
    paymentType: string;
    transactionCurrency: string;
    description?: string;
  }): Promise<PaymentResponse> {
    const response = await this.api.post<PaymentResponse>('/payment', data);
    return response.data;
  }

  async getPaymentMethods(paymentId: string, quantity: number) {
    const response = await this.api.get(`/payment/${paymentId}/methods`, {
      params: { quantity },
    });
    return response.data;
  }

  async confirmPaymentMethod(
    paymentId: string,
    method: string,
    quantity?: number
  ): Promise<PaymentResponse> {
    const response = await this.api.post<PaymentResponse>(
      `/payment/${paymentId}`,
      {
        paymentMethod: method,
        quantity,
      }
    );
    return response.data;
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentResponse> {
    const response = await this.api.get<PaymentResponse>(`/payment/${paymentId}`);
    return response.data;
  }

  async getQRCode(paymentId: string, format: 'png' | 'svg' = 'png') {
    const response = await this.api.get('/payment/qr', {
      params: { idPayment: paymentId, format },
    });
    return response.data;
  }

  async getPixPrices() {
    const response = await this.api.get('/payment/pix/prices');
    return response.data;
  }

  // Dados de usuário
  async getUserProfile() {
    const response = await this.api.get('/user/profile');
    return response.data;
  }

  async getUserBalance() {
    const response = await this.api.get('/user/balance');
    return response.data;
  }

  async getUserTransactions(limit = 50, offset = 0) {
    const response = await this.api.get('/user/transactions', {
      params: { limit, offset },
    });
    return response.data;
  }

  // Mercado
  async getMarketData(symbol: string) {
    const response = await this.api.get(
      `https://market-data.production.cocos.capital/book`,
      {
        params: { symbol },
      }
    );
    return response.data;
  }

  async getCryptoData() {
    const response = await this.api.get(
      'https://market-data.production.cocos.capital/crypto'
    );
    return response.data;
  }

  // Storage
  private async getStoredToken(): Promise<string | null> {
    if (this.token) return this.token;

    const { value } = await Preferences.get({ key: 'auth_token' });
    return value || null;
  }

  private async getStoredRefreshToken(): Promise<string | null> {
    if (this.refreshToken) return this.refreshToken;

    const { value } = await Preferences.get({ key: 'refresh_token' });
    return value || null;
  }

  // Utilitários
  private getUserAgent(): string {
    if (this.deviceInfo) {
      return `Cocos/${this.deviceInfo.platform}/${this.deviceInfo.osVersion}`;
    }
    return 'Cocos/Mobile';
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getStoredToken();
    return !!token;
  }

  getToken(): string | null {
    return this.token;
  }
}

// Exportar instância única
export const cocosAPI = new CocoAPI();
