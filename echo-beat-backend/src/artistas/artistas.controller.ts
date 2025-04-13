import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { ArtistasService } from './artistas.service';

@ApiTags('Artistas')
@Controller('artistas')
export class ArtistasController {
  constructor(private readonly artistasService: ArtistasService) { }

  /**
 * Obtiene el perfil de un artista, incluyendo biografía, discografía y top 5 canciones más reproducidas.
 * 
 * @param artistName - Nombre del artista.
 * @returns Un objeto con información del artista, sus álbumes y canciones más escuchadas.
 */
  @Get('perfil')
  @ApiOperation({ summary: 'Obtener perfil de un artista con biografía, discografía y top 5 canciones' })
  @ApiQuery({ name: 'artistName', type: String, description: 'Nombre del artista', example: 'Bad Bunny' })
  @ApiResponse({ status: 200, description: 'Perfil del artista encontrado' })
  @ApiResponse({ status: 404, description: 'Artista no encontrado' })
  async getArtistProfile(@Query('artistName') artistName: string) {
    return this.artistasService.getArtistProfile(artistName);
  }
}
