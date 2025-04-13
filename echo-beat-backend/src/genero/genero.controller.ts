import { Controller, Get, Post, Body, Query, BadRequestException, HttpCode, HttpStatus } from '@nestjs/common';
import { GeneroService } from './genero.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@Controller('genero')
export class GeneroController {
  constructor(private readonly generoService: GeneroService) { }

  /**
 * Obtiene los géneros musicales preferidos por un usuario junto a sus fotos.
 *
 * @param userEmail - Correo electrónico del usuario.
 * @returns Un array de objetos con `NombreGenero` y `FotoGenero`.
 */
  @ApiOperation({ summary: 'Obtener los géneros y sus fotos de las preferencias del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Géneros y fotos obtenidos correctamente.',
    type: [Object],
  })
  @ApiResponse({ status: 404, description: 'No se encontraron géneros para el usuario.' })
  @Get('preferencia')
  async getGenerosByEmail(@Query('userEmail') userEmail: string): Promise<{ NombreGenero: string; FotoGenero: string }[]> {
    if (!userEmail) {
      throw new BadRequestException('El parámetro userEmail es requerido.');
    }

    return this.generoService.getGenerosConFotosByEmail(userEmail);
  }

  /**
 * Obtiene todos los géneros existentes y señala cuáles están seleccionados por el usuario.
 *
 * @param userEmail - Correo del usuario.
 * @returns Lista de géneros con propiedad `seleccionado: boolean`.
 */
  @ApiOperation({ summary: 'Obtener todos los géneros y si el usuario los tiene seleccionados' })
  @ApiResponse({ status: 200, description: 'Lista de géneros con su estado de selección.' })
  @Get()
  async getAllGenerosWithUserSelection(@Query('userEmail') userEmail: string) {
    return this.generoService.getAllGenerosWithUserSelection(userEmail);
  }

  /**
 * Actualiza las preferencias de géneros musicales de un usuario.
 *
 * @param input - Objeto con el correo del usuario y el array de géneros seleccionados.
 * @returns Mensaje de éxito al actualizar las preferencias.
 */
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
