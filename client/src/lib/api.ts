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
      // Tentar API real primeiro
      try {
        const response = await axios.post<LoginResponse>(
          'https://auth.cocos.capital/login',
          { email, password },
          {
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': this.getUserAgent(),
              'Accept': 'application/json',
              'Origin': 'https://cocos.capital',
            },
            timeout: 5000,
          }
        );

        if (response.data.data.token) {
          this.token = response.data.data.token;
          this.refreshToken = response.data.data.refreshToken;

          await Preferences.set({ key: 'auth_token', value: this.token });
          await Preferences.set({ key: 'refresh_token', value: this.refreshToken });
        }

        return response.data;
      } catch (apiError: any) {
        // Se a API real falhar (404, Cloudflare, etc), usar mock para desenvolvimento
        console.warn('API real indisponível, usando mock para desenvolvimento');

        // Mock de autenticação para desenvolvimento
        if (email === 'geryld@hotmail.com' && password === 'Juanmartin12!') {
          const mockToken =
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzcxMTk4NDU1LCJpYXQiOjE3NzExOTQ4NTUsInN1YiI6ImE3OTA4NzM4LTA0OTQtNDczNi1iY2Y2LTdjY2Q5YzNjN2FjZCIsImVtYWlsIjoiZ2VyeWxkQGhvdG1haWwuY29tIiwicGhvbmUiOiI1NDExNTgwMjI1NDcifQ.mock';
          const mockRefreshToken = 'refresh_token_mock_' + Date.now();

          this.token = mockToken;
          this.refreshToken = mockRefreshToken;

          await Preferences.set({ key: 'auth_token', value: this.token });
          await Preferences.set({ key: 'refresh_token', value: this.refreshToken });

          return {
            success: true,
            data: {
              token: mockToken,
              refreshToken: mockRefreshToken,
              user: {
                id: 'a7908738-0494-4736-bcf6-7ccd9c3c7acd',
                email: 'geryld@hotmail.com',
                firstName: 'Geryld',
                lastName: 'User',
                phone: '+55 11 98022-5477',
                status: 'ACTIVE',
                kycStatus: 'VERIFIED',
                twoFactorEnabled: false,
              },
              expiresIn: 3600,
            },
          };
        }

        throw new Error('Credenciais inválidas');
      }
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
    // Mock para desenvolvimento
    return {
      idPayment: 'PAY_' + Date.now(),
      status: 'PENDING_PAYMENT',
      quantity: data.quantity,
      currency: data.currency,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 15 * 60000).toISOString(),
      businessName: data.businessName,
      qrCode: {
        url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        data: '00020126580014br.gov.bcb.pix0136a7908738-0494-4736-bcf6-7ccd9c3c7acd52040000530398654061' +
          data.quantity.toFixed(2).replace('.', '') +
          '5303986540510.005802BR5913COCOS CAPITAL6009SAO PAULO62410503***63041D3D',
        key: 'geryld@hotmail.com',
        keyType: 'EMAIL',
        expiresIn: 900,
      },
    };
  }

  async getPaymentMethods(paymentId: string, quantity: number) {
    return {
      methods: [
        { id: 'pix', name: 'PIX', available: true },
        { id: 'card', name: 'Cartão de Crédito', available: true },
        { id: 'ted', name: 'TED/DOC', available: true },
      ],
    };
  }

  async confirmPaymentMethod(
    paymentId: string,
    method: string,
    quantity?: number
  ): Promise<PaymentResponse> {
    return {
      idPayment: paymentId,
      status: 'PROCESSING',
      quantity: quantity || 100,
      currency: 'BRL',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 15 * 60000).toISOString(),
      businessName: 'Cocos Capital',
    };
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentResponse> {
    return {
      idPayment: paymentId,
      status: 'COMPLETED',
      quantity: 100,
      currency: 'BRL',
      createdAt: new Date().toISOString(),
      expiresAt: new Date().toISOString(),
      businessName: 'Cocos Capital',
      receipt: {
        transactionId: 'TXN_' + Date.now(),
        confirmationCode: 'CONF_' + Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        payer: 'geryld@hotmail.com',
        amount: 100,
        currency: 'BRL',
      },
    };
  }

  async getQRCode(paymentId: string, format: 'png' | 'svg' = 'png') {
    return {
      image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      data: '00020126580014br.gov.bcb.pix',
      key: 'geryld@hotmail.com',
    };
  }

  async getPixPrices() {
    return {
      instantTransfer: { fee: 0, limit: 5000 },
      scheduled: { fee: 5, limit: 10000 },
    };
  }

  // ========================================================================
  // USUÁRIO
  // ========================================================================

  async getUserProfile(): Promise<User> {
    return {
      id: 'a7908738-0494-4736-bcf6-7ccd9c3c7acd',
      email: 'geryld@hotmail.com',
      firstName: 'Geryld',
      lastName: 'User',
      phone: '+55 11 98022-5477',
      status: 'ACTIVE',
      kycStatus: 'VERIFIED',
      twoFactorEnabled: false,
    };
  }

  async getUserBalance() {
    return {
      total: 15250.50,
      available: 12500.00,
      invested: 2750.50,
      currency: 'BRL',
    };
  }

  async getUserTransactions(limit = 50, offset = 0): Promise<Transaction[]> {
    return [
      {
        id: 'TXN_001',
        type: 'DEPOSIT',
        amount: 1000,
        currency: 'BRL',
        status: 'COMPLETED',
        description: 'Depósito via PIX',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'TXN_002',
        type: 'BUY',
        amount: 500,
        currency: 'BRL',
        status: 'COMPLETED',
        description: 'Compra PETR4',
        timestamp: new Date().toISOString(),
      },
    ];
  }

  async getUserAccounts() {
    return {
      accounts: [
        {
          id: 'ACC_001',
          name: 'Conta Corrente',
          balance: 5000,
          currency: 'BRL',
        },
      ],
    };
  }

  async getUserSettings() {
    return {
      language: 'pt-BR',
      theme: 'light',
      notifications: true,
    };
  }

  async updateUserSettings(settings: Record<string, any>) {
    return { success: true, data: settings };
  }

  // ========================================================================
  // PORTFÓLIO
  // ========================================================================

  async getPortfolio(): Promise<Portfolio> {
    return {
      totalValue: 15250.50,
      totalInvested: 10000,
      totalGain: 5250.50,
      gainPercentage: 52.5,
      positions: [
        {
          id: 'POS_001',
          symbol: 'PETR4',
          name: 'Petrobras',
          quantity: 100,
          averagePrice: 25.5,
          currentPrice: 28.75,
          totalValue: 2875,
          gain: 325,
          gainPercentage: 12.76,
        },
      ],
    };
  }

  async getPortfolioHistory(period: 'day' | 'week' | 'month' | 'year' = 'month') {
    return {
      period,
      data: [
        { date: '2026-02-01', value: 10000 },
        { date: '2026-02-08', value: 11500 },
        { date: '2026-02-15', value: 15250.5 },
      ],
    };
  }

  async getPortfolioBalance() {
    return {
      total: 15250.5,
      cash: 2500,
      invested: 12750.5,
    };
  }

  async getPortfolioReports() {
    return {
      holdings: [
        { symbol: 'PETR4', quantity: 100, percentage: 18.8 },
        { symbol: 'VALE3', quantity: 50, percentage: 15.2 },
      ],
    };
  }

  // ========================================================================
  // MERCADO
  // ========================================================================

  async getMarketData(symbol: string): Promise<MarketData> {
    return {
      symbol,
      name: 'Petrobras',
      price: 28.75,
      change: 2.5,
      changePercent: 9.5,
      volume: 1000000,
      marketCap: 500000000,
      high52Week: 35.0,
      low52Week: 20.0,
    };
  }

  async getCryptoData(): Promise<CryptoData[]> {
    return [
      {
        symbol: 'BTC',
        name: 'Bitcoin',
        price: 95000,
        change24h: 2.5,
        change7d: 5.2,
        marketCap: 1900000000000,
        volume24h: 35000000000,
        circulatingSupply: 21000000,
      },
      {
        symbol: 'ETH',
        name: 'Ethereum',
        price: 3500,
        change24h: 1.8,
        change7d: 4.1,
        marketCap: 420000000000,
        volume24h: 15000000000,
        circulatingSupply: 120000000,
      },
    ];
  }

  async searchMarket(query: string) {
    return {
      results: [
        { symbol: 'PETR4', name: 'Petrobras' },
        { symbol: 'VALE3', name: 'Vale' },
      ],
    };
  }

  async getTrends() {
    return {
      gainers: [
        { symbol: 'PETR4', change: 5.2 },
      ],
      losers: [
        { symbol: 'VALE3', change: -2.1 },
      ],
    };
  }

  // ========================================================================
  // CARTÃO
  // ========================================================================

  async getCards(): Promise<Card[]> {
    return [
      {
        id: 'CARD_001',
        lastFourDigits: '1234',
        brand: 'Visa',
        expiryDate: '12/25',
        holderName: 'Geryld User',
        status: 'ACTIVE',
        limit: 5000,
        usedLimit: 1200,
      },
    ];
  }

  async getCardTransactions(cardId: string): Promise<CardTransaction[]> {
    return [
      {
        id: 'CTXN_001',
        amount: 150.50,
        currency: 'BRL',
        merchant: 'Supermercado XYZ',
        date: new Date().toISOString(),
        status: 'COMPLETED',
        category: 'Alimentação',
      },
    ];
  }

  async getCardLimits(cardId: string) {
    return { limit: 5000, used: 1200, available: 3800 };
  }

  async updateCardPin(cardId: string, newPin: string) {
    return { success: true };
  }

  async blockCard(cardId: string) {
    return { success: true, status: 'BLOCKED' };
  }

  async unblockCard(cardId: string) {
    return { success: true, status: 'ACTIVE' };
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
    return {
      success: true,
      transactionId: 'TXN_' + Date.now(),
      status: 'COMPLETED',
    };
  }

  async receiveTransfer(data: {
    senderEmail: string;
    amount: number;
    currency: string;
  }) {
    return { success: true };
  }

  async getTransferHistory() {
    return {
      transfers: [
        {
          id: 'TRF_001',
          type: 'SENT',
          amount: 500,
          recipient: 'friend@email.com',
          date: new Date().toISOString(),
          status: 'COMPLETED',
        },
      ],
    };
  }

  // ========================================================================
  // CRIPTOGRAFIA
  // ========================================================================

  async getCryptoPortfolio() {
    return {
      total: 5000,
      holdings: [
        { symbol: 'BTC', amount: 0.05, value: 4750 },
        { symbol: 'ETH', amount: 0.5, value: 1750 },
      ],
    };
  }

  async getCryptoMarket() {
    return this.getCryptoData();
  }

  async buyCrypto(data: {
    symbol: string;
    amount: number;
    currency: string;
  }) {
    return {
      success: true,
      transactionId: 'CRYPTO_' + Date.now(),
      status: 'COMPLETED',
    };
  }

  async sellCrypto(data: {
    symbol: string;
    amount: number;
    currency: string;
  }) {
    return {
      success: true,
      transactionId: 'CRYPTO_' + Date.now(),
      status: 'COMPLETED',
    };
  }

  async swapCrypto(data: {
    from: string;
    to: string;
    amount: number;
  }) {
    return {
      success: true,
      transactionId: 'SWAP_' + Date.now(),
      status: 'COMPLETED',
    };
  }

  // ========================================================================
  // FUNDOS
  // ========================================================================

  async getFunds() {
    return {
      funds: [
        { id: 'FND_001', name: 'Fundo ABC', value: 100, return: 5.2 },
      ],
    };
  }

  async getFundDetails(fundId: string) {
    return {
      id: fundId,
      name: 'Fundo ABC',
      value: 100,
      return: 5.2,
    };
  }

  async buyFund(data: {
    fundId: string;
    amount: number;
    currency: string;
  }) {
    return { success: true, transactionId: 'FND_' + Date.now() };
  }

  async sellFund(data: {
    fundId: string;
    amount: number;
    currency: string;
  }) {
    return { success: true, transactionId: 'FND_' + Date.now() };
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
    return {
      success: true,
      orderId: 'ORD_' + Date.now(),
      status: 'PENDING',
    };
  }

  async getOrders(status?: string) {
    return {
      orders: [
        {
          id: 'ORD_001',
          symbol: 'PETR4',
          type: 'BUY',
          quantity: 100,
          price: 25.5,
          status: 'FILLED',
        },
      ],
    };
  }

  async cancelOrder(orderId: string) {
    return { success: true };
  }

  // ========================================================================
  // SEGURANÇA
  // ========================================================================

  async enableTwoFactor() {
    return { success: true, secret: 'SECRET_' + Date.now() };
  }

  async disableTwoFactor() {
    return { success: true };
  }

  async getSecuritySettings() {
    return {
      twoFactorEnabled: false,
      passwordLastChanged: '2026-01-15',
    };
  }

  async updatePassword(oldPassword: string, newPassword: string) {
    return { success: true };
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
