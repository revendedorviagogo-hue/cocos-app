import axios, { AxiosInstance } from 'axios';
import { Preferences } from '@capacitor/preferences';
import { Device } from '@capacitor/device';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  status: string;
  kycStatus: string;
  twoFactorEnabled: boolean;
}

export interface LoginResponse {
  success: boolean;
  data: {
    token: string;
    refreshToken: string;
    user: User;
    expiresIn: number;
  };
}

export interface PaymentResponse {
  idPayment: string;
  status: 'PENDING' | 'PENDING_PAYMENT' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'EXPIRED';
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
  receipt?: {
    transactionId: string;
    confirmationCode: string;
    timestamp: string;
    payer: string;
    amount: number;
    currency: string;
  };
}

export interface Transaction {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER' | 'BUY' | 'SELL';
  amount: number;
  currency: string;
  status: string;
  description: string;
  timestamp: string;
  details?: Record<string, any>;
}

export interface Portfolio {
  totalValue: number;
  totalInvested: number;
  totalGain: number;
  gainPercentage: number;
  positions: Position[];
}

export interface Position {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  totalValue: number;
  gain: number;
  gainPercentage: number;
}

export interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  high52Week?: number;
  low52Week?: number;
}

export interface CryptoData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  change7d: number;
  marketCap: number;
  volume24h: number;
  circulatingSupply: number;
}

export interface Card {
  id: string;
  lastFourDigits: string;
  brand: string;
  expiryDate: string;
  holderName: string;
  status: string;
  limit: number;
  usedLimit: number;
}

export interface CardTransaction {
  id: string;
  amount: number;
  currency: string;
  merchant: string;
  date: string;
  status: string;
  category: string;
}

// ============================================================================
// CLASSE API PRINCIPAL
// ============================================================================

class CocosCompleteAPI {
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

    // Interceptor para adicionar token e headers
    this.api.interceptors.request.use(async (config) => {
      const token = await this.getStoredToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      if (!this.deviceInfo) {
        try {
          this.deviceInfo = await Device.getInfo();
        } catch (err) {
          this.deviceInfo = { platform: 'web' };
        }
      }

      config.headers['User-Agent'] = this.getUserAgent();
      config.headers['X-Device-ID'] = `${this.deviceInfo.platform}-${Date.now()}`;
      config.headers['X-Platform'] = this.deviceInfo.platform;

      return config;
    });

    // Interceptor para tratamento de erros
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          const refreshed = await this.refreshAccessToken();
          if (refreshed && error.config) {
            return this.api.request(error.config);
          } else {
            await this.logout();
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // ========================================================================
  // AUTENTICAÇÃO
  // ========================================================================

  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await axios.post<LoginResponse>(
        'https://auth.cocos.capital/login',
        { email, password },
        { headers: { 'Content-Type': 'application/json', 'User-Agent': this.getUserAgent() } }
      );

      if (response.data.data.token) {
        this.token = response.data.data.token;
        this.refreshToken = response.data.data.refreshToken;

        await Preferences.set({ key: 'auth_token', value: this.token });
        await Preferences.set({ key: 'refresh_token', value: this.refreshToken });
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
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (response.data.data.token) {
        this.token = response.data.data.token;
        await Preferences.set({ key: 'auth_token', value: this.token });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Refresh token error:', error);
      return false;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getStoredToken();
    return !!token;
  }

  // ========================================================================
  // PAGAMENTOS PIX
  // ========================================================================

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
      { paymentMethod: method, quantity }
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

  // ========================================================================
  // USUÁRIO
  // ========================================================================

  async getUserProfile(): Promise<User> {
    const response = await this.api.get<User>('/user/profile');
    return response.data;
  }

  async getUserBalance() {
    const response = await this.api.get('/user/balance');
    return response.data;
  }

  async getUserTransactions(limit = 50, offset = 0): Promise<Transaction[]> {
    const response = await this.api.get<Transaction[]>('/user/transactions', {
      params: { limit, offset },
    });
    return response.data;
  }

  async getUserAccounts() {
    const response = await this.api.get('/user/accounts');
    return response.data;
  }

  async getUserSettings() {
    const response = await this.api.get('/user/settings');
    return response.data;
  }

  async updateUserSettings(settings: Record<string, any>) {
    const response = await this.api.put('/user/settings', settings);
    return response.data;
  }

  // ========================================================================
  // PORTFÓLIO
  // ========================================================================

  async getPortfolio(): Promise<Portfolio> {
    const response = await this.api.get<Portfolio>('/portfolio');
    return response.data;
  }

  async getPortfolioHistory(period: 'day' | 'week' | 'month' | 'year' = 'month') {
    const response = await this.api.get('/portfolio/history', {
      params: { period },
    });
    return response.data;
  }

  async getPortfolioBalance() {
    const response = await this.api.get('/portfolio/balance');
    return response.data;
  }

  async getPortfolioReports() {
    const response = await this.api.get('/portfolio/reports/holdings');
    return response.data;
  }

  // ========================================================================
  // MERCADO
  // ========================================================================

  async getMarketData(symbol: string): Promise<MarketData> {
    const response = await this.api.get<MarketData>(
      'https://market-data.production.cocos.capital/book',
      { params: { symbol } }
    );
    return response.data;
  }

  async getCryptoData(): Promise<CryptoData[]> {
    const response = await this.api.get<CryptoData[]>(
      'https://market-data.production.cocos.capital/crypto'
    );
    return response.data;
  }

  async searchMarket(query: string) {
    const response = await this.api.get('/market/search', {
      params: { q: query },
    });
    return response.data;
  }

  async getTrends() {
    const response = await this.api.get('/market/trends');
    return response.data;
  }

  // ========================================================================
  // CARTÃO
  // ========================================================================

  async getCards(): Promise<Card[]> {
    const response = await this.api.get<Card[]>('/card');
    return response.data;
  }

  async getCardTransactions(cardId: string): Promise<CardTransaction[]> {
    const response = await this.api.get<CardTransaction[]>(`/card/${cardId}/transactions`);
    return response.data;
  }

  async getCardLimits(cardId: string) {
    const response = await this.api.get(`/card/${cardId}/limits`);
    return response.data;
  }

  async updateCardPin(cardId: string, newPin: string) {
    const response = await this.api.put(`/card/${cardId}/pin`, { pin: newPin });
    return response.data;
  }

  async blockCard(cardId: string) {
    const response = await this.api.post(`/card/${cardId}/block`);
    return response.data;
  }

  async unblockCard(cardId: string) {
    const response = await this.api.post(`/card/${cardId}/unblock`);
    return response.data;
  }

  // ========================================================================
  // TRANSFERÊNCIAS
  // ========================================================================

  async sendTransfer(data: {
    recipientEmail: string;
    amount: number;
    currency: string;
    description?: string;
  }) {
    const response = await this.api.post('/send', data);
    return response.data;
  }

  async receiveTransfer(data: {
    senderEmail: string;
    amount: number;
    currency: string;
  }) {
    const response = await this.api.post('/receive', data);
    return response.data;
  }

  async getTransferHistory() {
    const response = await this.api.get('/movements');
    return response.data;
  }

  // ========================================================================
  // CRIPTOGRAFIA
  // ========================================================================

  async getCryptoPortfolio() {
    const response = await this.api.get('/crypto/portfolio');
    return response.data;
  }

  async getCryptoMarket() {
    const response = await this.api.get('/crypto/market');
    return response.data;
  }

  async buyCrypto(data: {
    symbol: string;
    amount: number;
    currency: string;
  }) {
    const response = await this.api.post('/crypto/buy', data);
    return response.data;
  }

  async sellCrypto(data: {
    symbol: string;
    amount: number;
    currency: string;
  }) {
    const response = await this.api.post('/crypto/sell', data);
    return response.data;
  }

  async swapCrypto(data: {
    from: string;
    to: string;
    amount: number;
  }) {
    const response = await this.api.post('/crypto/swap', data);
    return response.data;
  }

  // ========================================================================
  // FUNDOS
  // ========================================================================

  async getFunds() {
    const response = await this.api.get('/funds');
    return response.data;
  }

  async getFundDetails(fundId: string) {
    const response = await this.api.get(`/funds/${fundId}`);
    return response.data;
  }

  async buyFund(data: {
    fundId: string;
    amount: number;
    currency: string;
  }) {
    const response = await this.api.post('/funds/buy', data);
    return response.data;
  }

  async sellFund(data: {
    fundId: string;
    amount: number;
    currency: string;
  }) {
    const response = await this.api.post('/funds/sell', data);
    return response.data;
  }

  // ========================================================================
  // ORDENS
  // ========================================================================

  async createOrder(data: {
    symbol: string;
    type: 'BUY' | 'SELL';
    quantity: number;
    price: number;
    currency: string;
  }) {
    const response = await this.api.post('/orders', data);
    return response.data;
  }

  async getOrders(status?: string) {
    const response = await this.api.get('/orders', {
      params: { status },
    });
    return response.data;
  }

  async cancelOrder(orderId: string) {
    const response = await this.api.delete(`/orders/${orderId}`);
    return response.data;
  }

  // ========================================================================
  // SEGURANÇA
  // ========================================================================

  async enableTwoFactor() {
    const response = await this.api.post('/security/2fa/enable');
    return response.data;
  }

  async disableTwoFactor() {
    const response = await this.api.post('/security/2fa/disable');
    return response.data;
  }

  async getSecuritySettings() {
    const response = await this.api.get('/security');
    return response.data;
  }

  async updatePassword(oldPassword: string, newPassword: string) {
    const response = await this.api.post('/security/password', {
      oldPassword,
      newPassword,
    });
    return response.data;
  }

  // ========================================================================
  // UTILITÁRIOS
  // ========================================================================

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

  private getUserAgent(): string {
    if (this.deviceInfo) {
      return `Cocos/${this.deviceInfo.platform}/${this.deviceInfo.osVersion}`;
    }
    return 'Cocos/Mobile';
  }

  getToken(): string | null {
    return this.token;
  }
}

// Exportar instância única
export const cocosAPI = new CocosCompleteAPI();
