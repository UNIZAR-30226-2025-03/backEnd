import { Controller, Get, Post, HttpCode, HttpStatus, Body, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthGuard } from './guards/auth.guard';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UsersService } from '../users/users.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

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
  @UseGuards(AuthGuard)
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


  
}
