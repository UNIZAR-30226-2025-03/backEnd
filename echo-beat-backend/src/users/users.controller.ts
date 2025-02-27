import { Controller, Get, Post, Body, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiOperation, ApiResponse, ApiBody, ApiTags } from '@nestjs/swagger';
import { ConflictException, InternalServerErrorException } from '@nestjs/common';


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
    Password: string;
    Nick: string;
    FechaNacimiento: string;
  }) {
    try {
      return await this.usersService.createUser(
        input.Email,
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






  @ApiOperation({ summary: 'Obtener la última canción escuchada por el usuario y la lista/álbum a la que pertenece' })
  @ApiResponse({ status: 200, description: 'Datos obtenidos correctamente.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  @Get('last-played')
  async getUserLastPlayedData(@Query('userEmail') userEmail: string) {
    return this.usersService.getUserLastPlayedData(userEmail);
  }

  /**
   * Obtiene el minuto en el que un usuario dejó de escuchar una canción específica.
   * @param EmailUsuario - Correo electrónico del usuario.
   * @param IdCancion - ID de la canción.
   * @returns Minuto de escucha.
   */
  @ApiOperation({ summary: 'Obtener el minuto de escucha de la última canción escuchada de un usuario' })
  @ApiResponse({ status: 200, description: 'Minuto de escucha obtenido correctamente.' })
  @ApiResponse({ status: 404, description: 'No se encontró el registro de escucha.' })
  @Get('minuto-escucha')
  async getMinutoEscucha(
    @Query('EmailUsuario') EmailUsuario: string,
    @Query('IdCancion') IdCancion: number
  ): Promise<number> {
    console.log(`Buscando MinutoEscucha para EmailUsuario: ${EmailUsuario}, IdCancion: ${IdCancion}`);

    return this.usersService.getMinutoEscucha(EmailUsuario, IdCancion);
  }  
}