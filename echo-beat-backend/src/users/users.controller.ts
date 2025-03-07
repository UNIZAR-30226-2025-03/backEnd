import { Controller, Get, Post, Body, HttpCode, HttpStatus, UploadedFile, UseInterceptors, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiResponse, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { ConflictException, InternalServerErrorException } from '@nestjs/common';

@ApiConsumes('multipart/form-data')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Registrar un nuevo usuario' })
  @ApiResponse({ status: 201, description: 'Usuario registrado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  @ApiResponse({ status: 409, description: 'El Nick o Email ya están en uso.' })
  @ApiBody({
    schema: {
      properties: {
        Email: { type: 'string' },
        NombreCompleto: { type: 'string' },
        Password: { type: 'string' },
        Nick: { type: 'string' },
        FechaNacimiento: { type: 'string', format: 'date-time' },
      }
    }
  })
  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  async register(@Body() input: {
    Email: string;
    NombreCompleto: string;
    Password: string;
    Nick: string;
    FechaNacimiento: string;
  }) {
    try {
      return await this.usersService.createUser(
        input.Email,
        input.NombreCompleto,
        input.Password,
        input.Nick,
        new Date(input.FechaNacimiento), // Convertimos de string a Date
      );
      
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('El Nick o Email ya están en uso.');
      }
      console.error('Error en el registro:', error);
      throw new InternalServerErrorException('No se pudo registrar el usuario.');
    }
  }

  @ApiOperation({ summary: 'Obtener la última canción escuchada por el usuario y el minuto de reproducción' })
  @ApiResponse({ status: 200, description: 'Datos obtenidos correctamente.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  @Get('last-played-song')
  async getUserLastPlayedSong(@Query('userEmail') userEmail: string) {
    return this.usersService.getUserLastPlayedSong(userEmail);
  }

  @ApiOperation({ summary: 'Obtener la última lista/álbum  escuchada por el usuario' })
  @ApiResponse({ status: 200, description: 'Datos obtenidos correctamente.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  @Get('last-played-lists')
  async getUserLastPlayedList(@Query('userEmail') userEmail: string) {
    return this.usersService.getUserLastPlayedList(userEmail);
  }

  @ApiOperation({ summary: 'Obtener el nick de un usuario a partir de su correo' })
  @ApiResponse({ status: 200, description: 'Datos obtenidos correctamente.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  @Get('nick')
  async getUserNick(@Query('userEmail') userEmail: string) {
    return this.usersService.getUserNick(userEmail);
  }

  @ApiOperation({ summary: 'Obtener de un usuario sus credenciales' })
  @ApiResponse({ status: 200, description: 'Datos obtenidos correctamente.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  @Get('get-user')
  async getUser(@Query('userEmail') userEmail: string) {
    return this.usersService.getUser(userEmail);
  }

  @ApiOperation({ summary: 'Modificar el Nick de un usuario' })
  @ApiResponse({ status: 200, description: 'Datos actualizados correctamente.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  @ApiResponse({ status: 409, description: 'El Nick ya está en uso.' })
  @Post('change-nick')
  async updateUserNick(@Query('userEmail') userEmail: string,
                        @Query('Nick') Nick: string) {
    return this.usersService.updateUserNick(userEmail, Nick);
  }

  @ApiOperation({ summary: 'Actualizar la foto de perfil de un usuario' })
  @ApiResponse({ status: 200, description: 'Foto actualizada correctamente.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })  // Usuario no encontrado
  @ApiResponse({ status: 409, description: 'Error al procesar la foto.' })  // Error con la foto
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })  // Error interno
  @ApiBody({
    description: 'Email y foto del usuario',
    schema: {
      type: 'object',
      properties: {
        Email: { type: 'string' },
        file: { type: 'string', format: 'binary' }, // Aquí usamos 'string' con formato 'binary' para un solo archivo
      },
    },
  })
  @Post('update-photo')
  @UseInterceptors(FileInterceptor('file')) // Usa Multer para interceptar el archivo
  async updateUserPhoto(
    @Body() input: { Email: string },
    @UploadedFile() file: Express.Multer.File
  ) {
    return this.usersService.updateUserPhoto(input.Email, file);
  }

  @ApiOperation({ summary: 'Actualizar la privacidad de un usuario' })
  @ApiResponse({ status: 200, description: 'Tipo de privacidad actualizado correctamente.' })
  @ApiResponse({ status: 404, description: 'El usuario no existe.' })
  @ApiResponse({ status: 409, description: 'La privacidad utilizada como parámetro no es correcta.' })
  @ApiBody({
    description: 'Email y privacidad del usuario',
    schema: {
      type: 'object',
      properties: {
        Email: { type: 'string' },
        Privacy: { type: 'string' },
      },
    },
  })
  @Post('update-privacy')
  async updateUserPrivacy(
    @Body() input: { Email: string; Privacy: string }
  ) {
    return this.usersService.updateUserPrivacy(input.Email, input.Privacy);
  }
}