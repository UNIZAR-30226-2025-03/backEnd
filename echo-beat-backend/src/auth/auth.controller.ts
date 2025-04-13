import { Controller, Get, Req, Res, Post, Inject, HttpCode, HttpStatus, Body, Request, UseGuards, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UsersService } from '../users/users.service';
import { GoogleAuthService } from './google/google-auth.service';
import { Response } from 'express';
import { AuthGuard as GoogleAuthGuard } from '@nestjs/passport';


@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService,
    private readonly googleAuthService: GoogleAuthService,
    private readonly UsersService: UsersService,
  ) { }

  /**
 * Autentica al usuario con su email y contraseña.
 * 
 * @param input - Objeto con Email y Password.
 * @returns Un objeto con el JWT y los datos del usuario.
 */
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({ status: 200, description: 'Inicio de sesión exitoso.' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas.' })
  @ApiBody({ schema: { properties: { Email: { type: 'string' }, Password: { type: 'string' } } } })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() input: { Email: string, Password: string }) {
    return this.authService.authenticate(input);
  }

  /**
 * Envía un correo para restablecer la contraseña del usuario.
 * 
 * @param forgotPasswordDto - DTO con el Email del usuario.
 * @returns Mensaje de éxito si se envió el correo.
 */
  @ApiOperation({ summary: 'Solicitar restablecimiento de contraseña' })
  @ApiResponse({ status: 200, description: 'Correo de restablecimiento enviado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o usuario no encontrado.' })
  @ApiBody({ schema: { properties: { Email: { type: 'string' } } } })
  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.sendPasswordResetEmail(forgotPasswordDto.Email);
  }

  /**
 * Restablece la contraseña del usuario usando un token de recuperación.
 * 
 * @param resetPasswordDto - DTO con el token y la nueva contraseña.
 * @returns Mensaje indicando si el cambio fue exitoso.
 */
  @ApiOperation({ summary: 'Restablecer contraseña con token' })
  @ApiResponse({ status: 200, description: 'Contraseña restablecida exitosamente.' })
  @ApiResponse({ status: 400, description: 'Token inválido o expirado.' })
  @ApiBody({ schema: { properties: { Token: { type: 'string' }, NewPassword: { type: 'string' } } } })
  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto.Token, resetPasswordDto.NewPassword);
  }

  /**
 * Redirige al usuario a Google para iniciar sesión (solo Web).
 * 
 * @param req - Objeto de solicitud.
 */
  @ApiOperation({ summary: 'Redirigir al usuario a Google para autenticación' })
  @ApiResponse({ status: 302, description: 'Redirección a Google' })
  @Get('google')
  @UseGuards(GoogleAuthGuard('google'))
  async googleAuth(@Req() req) {
    // Redirección a Google
  }

  /**
 * Callback de Google OAuth que genera un JWT y redirige al frontend.
 * 
 * @param req - Objeto de solicitud con datos del usuario.
 * @param res - Objeto de respuesta.
 */
  @ApiOperation({ summary: 'Callback de Google después de autenticación' })
  @ApiResponse({
    status: 200,
    description: 'Autenticación exitosa, devuelve un JWT',
    schema: {
      example: {
        accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        user: {
          id: "123456",
          email: "usuario@gmail.com",
          name: "Usuario Google",
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado: El usuario no tiene cuenta registrada' })
  @Get('google/redirect')
  @UseGuards(GoogleAuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    try {
      const jwt = await this.authService.loginWithGoogle(req.user);

      const frontendUrl = 'http://localhost:5173';

      res.redirect(`${frontendUrl}/auth/callback?token=${jwt.accessToken}&email=${req.user.Email}`);
    } catch (error) {
      console.error("Error en googleAuthRedirect:", error);
      res.status(500).json({ message: "Error interno en la autenticación con Google" });
    }
  }

  /**
 * Inicia sesión con Google en dispositivos móviles utilizando un idToken.
 * 
 * @param body - Objeto que contiene el idToken de Google.
 * @returns Un JWT si la autenticación fue exitosa.
 */
  @ApiOperation({ summary: 'Inicio de sesión con Google en dispositivos móviles' })
  @ApiResponse({
    status: 200,
    description: 'Autenticación exitosa, devuelve un JWT',
    schema: {
      example: {
        accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        user: {
          id: "123456",
          email: "usuario@gmail.com",
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado: El usuario no tiene cuenta registrada' })
  @ApiBody({
    description: 'ID Token de Google para autenticación',
    required: true,
    schema: {
      type: 'object',
      properties: {
        idToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
        },
      },
    },
  })
  @Post('google/mobile')
  async googleAuthMobile(@Body() body) {
    const { idToken } = body;

    try {
      const ticket = await this.googleAuthService.verifyToken(idToken);
      const payload = ticket.getPayload();

      if (!payload) {
        throw new UnauthorizedException("Token de Google inválido");
      }
      const email = payload?.email;
      if (!email) {
        throw new UnauthorizedException("El email no está presente en el token de Google.");
      }

      const user = await this.UsersService.findUserByEmail(email);


      if (!user) {
        throw new UnauthorizedException("No tienes una cuenta registrada. Regístrate primero.");
      }

      return this.authService.loginWithGoogle(user);
    } catch (error) {
      throw new UnauthorizedException("Error al autenticar con Google");
    }
  }

  /**
 * Inicia sesión con Google intercambiando un código por un idToken.
 * 
 * @param body - Objeto con el código de autorización de Google.
 * @returns JWT de acceso si la autenticación fue exitosa.
 */
  @ApiOperation({ summary: 'Autenticación con Google usando código de autorización' })
  @ApiResponse({
    status: 200,
    description: 'Autenticación exitosa, devuelve un JWT',
    schema: {
      example: {
        accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        user: {
          id: "123456",
          email: "usuario@gmail.com",
          name: "Usuario Google",
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado: El usuario no tiene cuenta registrada' })
  @ApiBody({
    description: 'Código de autorización de Google para obtener el idToken y generar el accessToken',
    required: true,
    schema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          example: '4/0AX4XfWiX8XjP9PbiwK3Kvxtswz7mrM42_nNm_0V6obJ...',
        },
      },
    },
  })
  @Post('google/code')
  async googleAuthWithCode(@Body() body: { code: string }) {
    const { code } = body;

    try {
      const tokens = await this.googleAuthService.getGoogleTokens(code);

      if (!tokens.id_token) {
        throw new UnauthorizedException('Token de Google inválido');
      }

      const payload = await this.googleAuthService.verifyToken(tokens.id_token);

      const user = await this.authService.validateGoogleUser(payload);

      const jwt = await this.authService.loginWithGoogle(user);
      return { token: jwt.accessToken };
    } catch (error) {
      throw new UnauthorizedException('Error al autenticar con Google');
    }
  }

  /**
   * Verifica si un token JWT es válido.
   * 
   * @param body - Objeto que contiene el token JWT.
   * @returns Mensaje indicando si el token es válido o no.
   */
  @ApiOperation({ summary: 'Verificar si el token JWT es válido' })
  @ApiResponse({
    status: 200,
    description: 'Token válido',
    schema: {
      example: {
        message: "Token válido",
        user: {
          id: "123456",
          email: "usuario@gmail.com",
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido o caducado',
    schema: {
      example: {
        message: "Token inválido o caducado",
      },
    },
  })
  @ApiBody({
    description: 'Token JWT para verificación',
    required: true,
    schema: {
      type: 'object',
      properties: {
        token: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
        },
      },
    },
  })
  @Post('validate-token')
  async validateToken(@Body() body: { token: string }) {
    const { token } = body;

    const result = await this.authService.validateToken(token);

    if (result.message === 'Token válido') {
      return result;
    } else {
      return { message: result.message };
    }
  }
}


