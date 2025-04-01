import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { TipoBusqueda } from './enum/tipo-busqueda.enum';  // Importar el enum

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
        playlists: [{ Nombre: 'Lista 1', Descripcion: 'Lista de canciones favoritas', NumeroLikes: 100, Portada: 'url' }],
      },
    },
  })
  @ApiQuery({
    name: 'Búsqueda',
    required: true,  // 'q' es requerido para realizar la búsqueda
    description: 'Término de búsqueda (puede ser nombre de canción, artista, álbum, lista, etc.)',
    type: String,
    example: 'Rock',  // Ejemplo para Swagger
  })
  @ApiQuery({
    name: 'usuarioNick',
    required: true,  // 'usuarioNick' es requerido
    description: 'El nickname del usuario que realiza la búsqueda. Usado para obtener las playlists de amigos.',
    type: String,
    example: 'user123',  // Ejemplo para Swagger
  })
  @ApiQuery({
    name: 'tipo',
    required: false,  // 'tipo' es opcional
    description: 'Tipo de búsqueda: canciones, artistas, albums, playlists. Si no se especifica, se buscarán todos.',
    enum: TipoBusqueda,  // Usamos el enum aquí
    example: TipoBusqueda.Canciones,  // Ejemplo para Swagger
  })
  @Get()
  async search(
    @Query('Búsqueda') query: string,              // Término de búsqueda
    @Query('usuarioNick') usuarioNick: string,  // Nickname del usuario
    @Query('tipo') tipo?: TipoBusqueda            // Filtro: "canciones", "artistas", "albums", "playlists"
  ) {
    return this.searchService.search(query, usuarioNick, tipo);  // Pasar el filtro de tipo al servicio
  }
}
