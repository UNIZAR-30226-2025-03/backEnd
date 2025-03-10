import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { GeneroService } from './genero.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('genero')
export class GeneroController {
  constructor(private readonly generoService: GeneroService) { }

  /**
 * Busca todos los géneros asociados a un usuario por su correo electrónico.
 * 
 * Esta función realiza una consulta en la base de datos para obtener todas las preferencias
 * de un usuario identificado por su `userEmail`, y devuelve una lista con los nombres de los géneros
 * asociados a ese correo. La consulta solo obtiene el campo `NombreGenero` de la tabla `Preferencias`.
 * 
 * @param userEmail - Correo electrónico del usuario cuya información de preferencias se quiere obtener.
 * @returns Una promesa que resuelve un arreglo de cadenas (nombres de géneros) asociados al `userEmail`.
 */
  @ApiOperation({ summary: 'Obtener los géneros y sus fotos de las preferencias del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Géneros y fotos obtenidos correctamente.',
    type: [Object], // Cambié String a Object porque ahora retorna un array de objetos
  })
  @ApiResponse({ status: 404, description: 'No se encontraron géneros para el usuario.' })
  @Get('preferencia')
  async getGenerosByEmail(@Query('userEmail') userEmail: string): Promise<{ NombreGenero: string; FotoGenero: string }[]> {
    if (!userEmail) {
      throw new BadRequestException('El parámetro userEmail es requerido.');
    }

    return this.generoService.getGenerosConFotosByEmail(userEmail);
  }

  @ApiOperation({ summary: 'Obtener todos los nombres de los géneros' })
  @ApiResponse({ status: 200, description: 'Lista de nombres de géneros.' })
  @Get()
  async getAllGeneros() {
    return this.generoService.getAllGeneros();
  }
}
