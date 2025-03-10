import { Controller, Get, Post, Body, Query, BadRequestException, HttpCode, HttpStatus } from '@nestjs/common';
import { GeneroService } from './genero.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

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

  @ApiOperation({ summary: 'Obtener todos los géneros y si el usuario los tiene seleccionados' })
  @ApiResponse({ status: 200, description: 'Lista de géneros con su estado de selección.' })
  @Get()
  async getAllGenerosWithUserSelection(@Query('userEmail') userEmail: string) {
    return this.generoService.getAllGenerosWithUserSelection(userEmail);
  }

  @ApiOperation({ summary: 'Actualizar preferencias de género a un usuario' })
  @ApiResponse({ status: 201, description: 'Preferencias actualizadas correctamente.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  @ApiBody({
    description: 'Objeto con el correo del usuario y una lista de géneros.',
    schema: {
      type: 'object',
      properties: {
        userEmail: { type: 'string', example: 'usuario@example.com' },
        generos: { 
          type: 'array', 
          items: { type: 'string' }, 
          example: ["Rock", "Pop", "Jazz"]
        },
      },
    },
  })
  @HttpCode(HttpStatus.CREATED)
  @Post('add')
  async updateUserPreferences(
    @Body() input: { userEmail: string; generos: string[] }
  ) {
    return this.generoService.updateUserPreferences(input.userEmail, input.generos);
  }
}
