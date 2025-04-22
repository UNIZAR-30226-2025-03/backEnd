import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.get('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get('GOOGLE_REDIRECT_URI'),
      scope: ['profile', 'email'],
    });
  }

  /**
 * Método de validación llamado después de que el usuario se autentica con Google.
 * Utiliza el perfil proporcionado por Google para validar o registrar al usuario.
 *
 * @param accessToken - Token de acceso proporcionado por Google.
 * @param refreshToken - Token de actualización proporcionado por Google.
 * @param profile - Perfil del usuario proporcionado por Google.
 * @param done - Callback para finalizar el proceso de validación.
 * @returns Una llamada al callback con el usuario validado.
 */
  async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback) {
    const {user,isNewUser} = await this.authService.validateGoogleUser(profile);
    return done(null, { 
      email: user.Email, 
      isNew: isNewUser
    });  }
}
