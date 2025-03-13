import { Controller, Get, Post, Body, HttpCode, HttpStatus, UploadedFile, UseInterceptors, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiResponse, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { ConflictException, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';

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
      if (!input.FechaNacimiento || isNaN(Date.parse(input.FechaNacimiento))) {
        throw new BadRequestException('Fecha de nacimiento inválida o formato incorrecto.');
      }

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

  @ApiOperation({
    summary: 'Obtener la primera canción de la cola de reproducción de un usuario',
    description: 'Esta API devuelve la primera canción de la cola de reproducción de un usuario.',
  })
  @ApiResponse({ status: 200, description: 'Canción obtenida correctamente.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado o cola vacía.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  @Get('first-song')
  @HttpCode(HttpStatus.OK)
  async getUserFirstSongFromQueue(@Query('Email') Email: string) {
    try {
      return await this.usersService.getUserFirstSongFromQueue(Email);
    } catch (error) {
      // Manejo específico del error de cola vacía
      if (error.message === 'No se encontró la cola de reproducción del usuario o está vacía.') {
        throw new NotFoundException(error.message);
      }
      // Para otros errores, lanzamos un error genérico del servidor
      throw new Error('Error interno del servidor.');
    }
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

  @ApiOperation({ 
    summary: 'Actualizar la foto de perfil de un usuario', 
    description: '⚠️ Esta API no puede probarse en Swagger porque requiere la carga de archivos mediante `multipart/form-data` desde una aplicación cliente.' 
  })
  @ApiResponse({ status: 200, description: 'Foto actualizada correctamente.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })  // Usuario no encontrado
  @ApiResponse({ status: 409, description: 'Error al procesar la foto.' })  // Error con la foto
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })  // Error interno
  @ApiConsumes('multipart/form-data') // Indicar que la API consume archivos
  @ApiBody({
    description: 'Datos para crear una playlist',
    schema: {
      type: 'object',
      properties: {
        emailUsuario: { type: 'string', example: 'any@example.com' },
        file: { type: 'string', format: 'binary' },
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

  @ApiOperation({ summary: 'Actualizar la fecha de nacimiento de un usuario' })
  @ApiResponse({ status: 200, description: 'Fecha de nacimiento actualizada correctamente.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o formato incorrecto.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  @ApiBody({
    description: 'Objeto con el correo del usuario y la nueva fecha de nacimiento',
    schema: {
      type: 'object',
      properties: {
        userEmail: { type: 'string', example: 'usuario@example.com' },
        birthdate: { type: 'string', format: 'date', example: '1990-05-15' }
      },
    },
  })
  @Post('update-birthdate')
  async updateUserBirthdate(
    @Body() input: { userEmail: string; birthdate: string }
  ) {
    return this.usersService.updateUserBirthdate(input.userEmail, input.birthdate);
  }

  @ApiOperation({ summary: 'Actualizar el nombre completo de un usuario' })
  @ApiResponse({ status: 200, description: 'Nombre completo actualizado correctamente.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  @ApiBody({
    description: 'Objeto con el correo del usuario y el nuevo nombre completo',
    schema: {
      type: 'object',
      properties: {
        userEmail: { type: 'string', example: 'usuario@example.com' },
        nombreReal: { type: 'string', example: 'Juan Pérez' }
      },
    },
  })
  @Post('update-fullname')
  async updateUserFullName(
    @Body() input: { userEmail: string; nombreReal: string }
  ) {
    return this.usersService.updateUserFullName(input.userEmail, input.nombreReal);
  }

  @ApiOperation({ summary: 'Obtener todas las URLs de imágenes del contenedor predeterminado' })
  @ApiResponse({ status: 200, description: 'Lista de URLs de imágenes obtenidas correctamente.' })
  @ApiResponse({ status: 500, description: 'Error interno al acceder al contenedor de Azure.' })
  @Get('default-photos')
  async getAllImageUrls() {
    return this.usersService.getAllUserDefaultImageUrls();
  }
}