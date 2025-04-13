import { Controller, Get, Post, Body, HttpCode, HttpStatus, UploadedFile, UseInterceptors, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiResponse, ApiBody, ApiConsumes, ApiQuery } from '@nestjs/swagger';
import { ConflictException, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  /**
 * Registra un nuevo usuario en el sistema.
 * 
 * @param input - Datos del nuevo usuario (email, nombre completo, contraseña, nick, fecha de nacimiento).
 * @returns El usuario creado o lanza excepciones si hay errores de validación.
 */
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
        new Date(input.FechaNacimiento),
      );

    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('El Nick o Email ya están en uso.');
      }
      console.error('Error en el registro:', error);
      throw new InternalServerErrorException('No se pudo registrar el usuario.');
    }
  }

  /**
 * Devuelve la primera canción de la cola de reproducción de un usuario.
 * 
 * @param Email - Email del usuario.
 * @returns Canción o excepción si no hay cola o usuario no existe.
 */
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
      return this.usersService.getUserFirstSongFromQueue(Email);
    } catch (error) {
      if (error.message === 'No se encontró la cola de reproducción del usuario o está vacía.') {
        throw new NotFoundException('Usuario no encontrado o cola vacía.');
      }
    }
  }

  /**
 * Devuelve el nick de un usuario.
 * 
 * @param userEmail - Correo electrónico del usuario.
 * @returns Nick del usuario.
 */
  @ApiOperation({ summary: 'Obtener el nick de un usuario a partir de su correo' })
  @ApiResponse({ status: 200, description: 'Datos obtenidos correctamente.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  @Get('nick')
  async getUserNick(@Query('userEmail') userEmail: string) {
    return this.usersService.getUserNick(userEmail);
  }

  /**
 * Devuelve la información del usuario (Email, Nick, Nombre, etc).
 * 
 * @param userEmail - Email del usuario.
 * @returns Información básica del usuario.
 */
  @ApiOperation({ summary: 'Obtener de un usuario sus credenciales' })
  @ApiResponse({ status: 200, description: 'Datos obtenidos correctamente.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  @Get('get-user')
  async getUser(@Query('userEmail') userEmail: string) {
    return this.usersService.getUser(userEmail);
  }

  /**
 * Cambia el nick de un usuario.
 * 
 * @param userEmail - Email del usuario.
 * @param Nick - Nuevo nick.
 * @returns Mensaje de éxito o conflicto si el nick ya está en uso.
 */
  @ApiOperation({ summary: 'Modificar el Nick de un usuario' })
  @ApiResponse({ status: 200, description: 'Datos actualizados correctamente.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  @ApiResponse({ status: 409, description: 'El Nick ya está en uso.' })
  @Post('change-nick')
  async updateUserNick(@Query('userEmail') userEmail: string,
    @Query('Nick') Nick: string) {
    return this.usersService.updateUserNick(userEmail, Nick);
  }

  /**
 * Sube y actualiza la foto de perfil del usuario.
 * 
 * @param input - Email del usuario.
 * @param file - Archivo de imagen subido.
 * @returns Resultado de la actualización.
 */
  @ApiOperation({
    summary: 'Actualizar la foto de perfil de un usuario'
  })
  @ApiResponse({ status: 200, description: 'Foto actualizada correctamente.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  @ApiResponse({ status: 409, description: 'Error al procesar la foto.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Datos para crear una playlist',
    schema: {
      type: 'object',
      properties: {
        Email: { type: 'string', example: 'any@example.com' },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @Post('update-photo')
  @UseInterceptors(FileInterceptor('file'))
  async updateUserPhoto(
    @Body() input: { Email: string },
    @UploadedFile() file: Express.Multer.File
  ) {
    return this.usersService.updateUserPhoto(input.Email, file);
  }

  /**
 * Actualiza la foto del usuario con una imagen predefinida.
 * 
 * @param input - Email del usuario y URL de la imagen predefinida.
 * @returns Resultado de la operación.
 */
  @ApiOperation({
    summary: 'Actualizar la foto de perfil del usuario con una imagen predeterminada',
    description: 'Permite al usuario actualizar su foto de perfil usando una imagen predefinida desde el contenedor de imágenes.',
  })
  @ApiResponse({ status: 200, description: 'Foto de perfil actualizada correctamente.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  @ApiResponse({ status: 400, description: 'La URL proporcionada no corresponde al contenedor correcto o la imagen no existe.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  @ApiBody({
    description: 'Datos para actualizar la foto de perfil del usuario',
    schema: {
      type: 'object',
      properties: {
        userEmail: { type: 'string', example: 'user@example.com' },
        imageUrl: { type: 'string', example: 'https://<blob-storage-url>/path-to-image.jpg' },
      },
    },
  })
  @Post('update-photo-default')
  @HttpCode(HttpStatus.OK)
  async updateUserDefaultPhoto(
    @Body() input: { userEmail: string, imageUrl: string }
  ) {
    return await this.usersService.updateUserDefaultPhoto(input.userEmail, input.imageUrl);
  }

  /**
 * Actualiza la privacidad de un usuario.
 * 
 * @param input - Email del usuario y tipo de privacidad (publico, privado, protegido).
 * @returns Resultado de la actualización.
 */
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

  /**
 * Actualiza la fecha de nacimiento del usuario.
 * 
 * @param input - Email del usuario y nueva fecha de nacimiento.
 * @returns Resultado de la operación.
 */
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

  /**
 * Actualiza el nombre completo del usuario.
 * 
 * @param input - Email del usuario y nuevo nombre completo.
 * @returns Resultado de la operación.
 */
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

  /**
 * Devuelve todas las URLs de imágenes de perfil predefinidas disponibles.
 * 
 * @returns Lista de URLs.
 */
  @ApiOperation({ summary: 'Obtener todas las URLs de imágenes del contenedor predeterminado' })
  @ApiResponse({ status: 200, description: 'Lista de URLs de imágenes obtenidas correctamente.' })
  @ApiResponse({ status: 500, description: 'Error interno al acceder al contenedor de Azure.' })
  @Get('default-photos')
  async getAllImageUrls() {
    return this.usersService.getAllUserDefaultImageUrls();
  }

  /**
 * Devuelve el perfil del usuario junto con sus playlists públicas y protegidas.
 * 
 * @param userEmail - Email del usuario.
 * @returns Perfil con playlists visibles.
 */
  @Get('profile-with-playlists')
  @ApiOperation({ summary: 'Obtener perfil de usuario y playlists públicas/protegidas' })
  @ApiQuery({ name: 'userEmail', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Perfil y listas obtenidas correctamente.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  async getUserProfileWithPlaylists(@Query('userEmail') userEmail: string) {
    return this.usersService.getUserProfileWithPublicPlaylists(userEmail);
  }
}