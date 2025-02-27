import { Controller, Get, Query } from '@nestjs/common';
import { GeneroService } from './genero.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('genero')
export class GeneroController {
  constructor(private readonly generoService: GeneroService) {}

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
  @ApiOperation({ summary: 'Obtener los géneros de las preferencias del usuario' })
  @ApiResponse({ status: 200, description: 'Géneros obtenidos correctamente.', type: [String] })
  @ApiResponse({ status: 404, description: 'No se encontraron géneros para el usuario.' })
  @Get('preferencia')
  async getGenerosByEmail(@Query('userEmail') userEmail: string): Promise<string[]> {
    return this.generoService.getGenerosByEmail(userEmail);
  }

    /**
   * Devuelve la foto asociada a un género dado su nombre.
   * 
   * @param nombreGenero El nombre del género para el que se busca la foto.
   * @returns La foto asociada al género.
   */
  /*
    @ApiOperation({ summary: 'Obtener la foto de un género por su nombre' })
    @ApiResponse({ status: 200, description: 'Foto del género obtenida correctamente.' })
    @ApiResponse({ status: 404, description: 'No se encontró el género.' })
    @Get('foto')
    async getFotoGenero(@Query('nombreGenero') nombreGenero: string): Promise<string> {
      return this.generoService.getFotoGeneroByNombre(nombreGenero);
    }
      */
}
