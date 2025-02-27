import { Controller, Get, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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
