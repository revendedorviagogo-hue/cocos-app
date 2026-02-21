import axios, { AxiosInstance } from 'axios';

/**
 * Cliente para chamar a API externa de desvincular identidades
 * 
 * Baseado na função unlinkIdentity encontrada no código Cocos
 */
export class UnlinkIdentityClient {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor(baseUrl: string = 'https://api.cocos.com') {
    this.baseUrl = baseUrl;
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }

  /**
   * Desvincular uma identidade (telefone, email, etc)
   * 
   * @param identityId - ID da identidade a desvincular (ex: "phone_123456")
   * @param accessToken - Token JWT de acesso do usuário
   * @returns Resposta da API
   */
  async unlinkIdentity(identityId: string, accessToken: string) {
    try {
      console.log(`[UnlinkIdentityClient] Desvinculando: ${identityId}`);

      const response = await this.client.delete(
        `/user/identities/${identityId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          }
        }
      );

      console.log(`[UnlinkIdentityClient] Sucesso:`, response.data);
      
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error: any) {
      console.error(`[UnlinkIdentityClient] Erro:`, error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data || error.message,
        status: error.response?.status || 500
      };
    }
  }

  /**
   * Desvincular telefone
   */
  async unlinkPhone(phoneId: string, accessToken: string) {
    return this.unlinkIdentity(`phone_${phoneId}`, accessToken);
  }

  /**
   * Desvincular email
   */
  async unlinkEmail(emailId: string, accessToken: string) {
    return this.unlinkIdentity(`email_${emailId}`, accessToken);
  }

  /**
   * Desvincular OAuth
   */
  async unlinkOAuth(provider: string, accessToken: string) {
    return this.unlinkIdentity(`oauth_${provider}`, accessToken);
  }

  /**
   * Listar todas as identidades do usuário
   */
  async listIdentities(accessToken: string) {
    try {
      console.log(`[UnlinkIdentityClient] Listando identidades`);

      const response = await this.client.get(
        `/user/identities`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          }
        }
      );

      console.log(`[UnlinkIdentityClient] Identidades:`, response.data);
      
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error: any) {
      console.error(`[UnlinkIdentityClient] Erro ao listar:`, error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data || error.message,
        status: error.response?.status || 500
      };
    }
  }
}

// Exportar instância singleton
export const unlinkIdentityClient = new UnlinkIdentityClient();
