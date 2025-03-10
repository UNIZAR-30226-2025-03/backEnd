import { Controller, Get, Req, Res, Post, Inject, HttpCode, HttpStatus, Body, Request, UseGuards, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UsersService } from '../users/users.service';
import { GoogleAuthService } from './google/google-auth.service';
import { Response } from 'express'; // 🔹 Importa Response de Express
import { AuthGuard as LocalAuthGuard } from './guards/auth.guard'; // Tu propio guard
import { AuthGuard as GoogleAuthGuard } from '@nestjs/passport'; // Guard de Passport para Google



@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService,    
              private readonly googleAuthService: GoogleAuthService,
              private readonly UsersService: UsersService,
  ) {}

  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({ status: 200, description: 'Inicio de sesión exitoso.' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas.' })
  @ApiBody({ schema: { properties: { Email: { type: 'string' }, Password: { type: 'string' } } } })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() input: { Email: string, Password: string }) {
    return this.authService.authenticate(input);
  }

  @ApiOperation({ summary: 'Obtener información del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Información del usuario obtenida exitosamente.' })
  @ApiResponse({ status: 401, description: 'Usuario no autenticado.' })
  @UseGuards(LocalAuthGuard)
  @Get('me')
  getUserInfo(@Request() request) {
    return request.Usuario;
  }
  

  
  @ApiOperation({ summary: 'Solicitar restablecimiento de contraseña' })
  @ApiResponse({ status: 200, description: 'Correo de restablecimiento enviado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o usuario no encontrado.' })
  @ApiBody({ schema: { properties: { Email: { type: 'string' } } } })
  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.sendPasswordResetEmail(forgotPasswordDto.Email);
  }

  @ApiOperation({ summary: 'Restablecer contraseña con token' })
  @ApiResponse({ status: 200, description: 'Contraseña restablecida exitosamente.' })
  @ApiResponse({ status: 400, description: 'Token inválido o expirado.' })
  @ApiBody({ schema: { properties: { Token: { type: 'string' }, NewPassword: { type: 'string' } } } })
  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto.Token, resetPasswordDto.NewPassword);
  }




  @ApiOperation({ summary: 'Redirigir al usuario a Google para autenticación' })
  @ApiResponse({ status: 302, description: 'Redirección a Google' })
  @Get('google')
  @UseGuards(GoogleAuthGuard('google'))
  async googleAuth(@Req() req) {
    // Esto solo redirige a Google
  }

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

      // 🔹 Define la URL del frontend manualmente
      const frontendUrl = 'http://localhost:5173'; // Cambia esto por tu URL real

      // 🔹 Redirigir al frontend con el token
      res.redirect(`${frontendUrl}/auth/callback?token=${jwt.accessToken}`);
    } catch (error) {
      console.error("Error en googleAuthRedirect:", error);
      res.status(500).json({ message: "Error interno en la autenticación con Google" });
    }

  }





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
      // 🔹 Verificar el token con Google
      const ticket = await this.googleAuthService.verifyToken(idToken);
      const payload = ticket.getPayload();

      if (!payload) {
        throw new UnauthorizedException("Token de Google inválido");
      }
      const email = payload?.email; 
      if (!email) {
        throw new UnauthorizedException("El email no está presente en el token de Google.");
      }

      // 🔹 Buscar usuario en la base de datos con el email validado
      const user = await this.UsersService.findUserByEmail(email);


      if (!user) {
        // ❌ Si el usuario no existe, rechazamos la autenticación
        throw new UnauthorizedException("No tienes una cuenta registrada. Regístrate primero.");
      }

      // 🔹 Generar un JWT
      return this.authService.loginWithGoogle(user); 
    } catch (error) {
      throw new UnauthorizedException("Error al autenticar con Google");
    }
  }
}
