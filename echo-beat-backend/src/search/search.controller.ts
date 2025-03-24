import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { ApiTags, ApiResponse, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @ApiOperation({ summary: 'Buscar canciones, artistas, álbumes y listas con filtros' })
  @ApiResponse({
    status: 200,
    description: 'Resultados de búsqueda con filtros',
    schema: {
      example: {
        artistas: [{ Nombre: 'Artista 1', Biografia: 'Biografía', FotoPerfil: 'url' }],
        canciones: [{ Nombre: 'Canción 1', Genero: 'Rock', Portada: 'url' }],
        albums: [{ Nombre: 'Álbum 1', FechaLanzamiento: '2023-01-01' }],
        listas: [{ Nombre: 'Lista 1', Descripcion: 'Lista de canciones favoritas' }],
      },
    },
  })
  @ApiQuery({
    name: 'tipo',
    required: false,  // 🔹 Hacemos que 'tipo' sea opcional
    description: 'Tipo de búsqueda: canciones, artistas, albums, playlists',
    type: String,
    example: 'canciones',  // Ejemplo para Swagger
  })
  @Get()
  async search(
    @Query('q') query: string,              // Término de búsqueda
    @Query('tipo') tipo?: string            // Filtro: "canciones", "artistas", "albums", "listas"
  ) {
    return this.searchService.search(query, tipo);  // Pasar el filtro de tipo al servicio
  }
}
