import { Injectable } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class GoogleAuthService {
  private client: OAuth2Client;

  constructor() {
    this.client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID_MOBILE);
  }

  async verifyToken(token: string) {
    const ticket = await this.client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID_MOBILE,
    });
    return ticket;
  }
    async getGoogleTokens(code: string) {
    const { tokens } = await this.client.getToken(code); // Usamos el `code` para obtener los tokens
    return tokens; // Esto incluirá `id_token` y `access_token`
  }
}
