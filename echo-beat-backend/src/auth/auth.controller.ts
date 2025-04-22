import { Controller, Get, Req, Res, Post, Inject, HttpCode, HttpStatus, Body, Request, Query, UseGuards, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody,ApiQuery  } from '@nestjs/swagger';
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
          email: "usuario1@gmail.com",
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

      const frontendUrl = 'https://echobeatweb.netlify.app';

      res.redirect(`${frontendUrl}/auth/callback?token=${jwt.accessToken}&email=${req.user.Email}&isNew=${req.user.isNew}`);

    } catch (error) {
      console.error("Error en googleAuthRedirect:", error);
      res.status(500).json({ message: "Error interno en la autenticación con Google" });
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
  
    /**
     * Callback móvil que recibe email y nombre completo, genera un JWT
     * y devuelve al frontend el token y los datos del usuario.
     */
    @ApiOperation({ summary: 'Callback Google móvil con parámetros email y nombre completo' })
    @ApiQuery({ name: 'email', required: true, description: 'Email del usuario tal como lo devuelve Google' })
    @ApiQuery({ name: 'fullName', required: true, description: 'Nombre completo del usuario tal como lo devuelve Google' })
    @ApiResponse({
      status: 200,
      description: 'Autenticación exitosa, devuelve un JWT y datos de usuario',
      schema: {
        example: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          user: {
            id: '123456',
            email: 'usuario@gmail.com',
            name: 'Usuario Google',
          },
        },
      },
    })
    @ApiResponse({ status: 400, description: 'Faltan parámetros email o fullName' })
    @ApiResponse({ status: 500, description: 'Error interno en la generación del token' })
    @Get('google/mobile')
    async googleAuthMobile(
      @Query('email') email: string,
      @Query('fullName') fullName: string,
      @Res() res: Response
    ) {
      if (!email || !fullName) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ message: 'Debe enviar los parámetros email y fullName' });
      }
  
      try {
        // Construimos un "profile" compatible con validateGoogleUser
        const profile = {
          emails: [{ value: email }],
          displayName: fullName,
        };
  
        // 1. Validar o crear el usuario
        const validatedUser = await this.authService.validateGoogleUser(profile);
  
        // 2. Generar token + datos
        const result = await this.authService.loginWithGoogle(validatedUser);
        // -> { accessToken: string, user: { id, email, name } }
  
        // 3. Devolver al cliente
        return res
          .status(HttpStatus.OK)
          .json(result);
      } catch (error) {
        console.error('Error en googleAuthMobile:', error);
        return res
          .status(HttpStatus.INTERNAL_SERVER_ERROR)
          .json({ message: 'Error interno en la autenticación con Google' });
      }
    }
  

























}


