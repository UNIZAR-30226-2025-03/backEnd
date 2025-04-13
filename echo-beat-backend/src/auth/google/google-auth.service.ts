import { Injectable } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class GoogleAuthService {
  private client: OAuth2Client;

  constructor() {
    this.client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID_MOBILE);
  }

  /**
 * Verifica un ID token proporcionado por Google y devuelve el ticket de autenticación.
 *
 * @param token - Token de ID de Google a verificar.
 * @returns Promesa que resuelve con el ticket de autenticación (información del usuario).
 */
  async verifyToken(token: string) {
    const ticket = await this.client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID_MOBILE,
    });
    return ticket;
  }

  /**
 * Intercambia un código de autorización por tokens de acceso y refresh de Google.
 *
 * @param code - Código de autorización obtenido tras el login con Google.
 * @returns Promesa que resuelve con los tokens obtenidos.
 */
  async getGoogleTokens(code: string) {
    const { tokens } = await this.client.getToken(code);
    return tokens;
  }
}
