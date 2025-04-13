import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { TipoBusqueda } from './enum/tipo-busqueda.enum';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) { }

  /**
 * Realiza una búsqueda general de canciones, artistas, álbumes y playlists según un término de búsqueda.
 *
 * @param query - Término de búsqueda (por ejemplo: nombre de canción, artista, álbum o lista).
 * @param usuarioNick - Nickname del usuario que realiza la búsqueda (usado para filtrar playlists de amigos).
 * @param tipo - (Opcional) Tipo de búsqueda: "canciones", "artistas", "albums", "playlists".
 * @returns Un objeto con los resultados de búsqueda según los filtros especificados.
 */
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
    required: true,
    description: 'Término de búsqueda (puede ser nombre de canción, artista, álbum, lista, etc.)',
    type: String,
    example: 'Rock',
  })
  @ApiQuery({
    name: 'usuarioNick',
    required: true,
    description: 'El nickname del usuario que realiza la búsqueda. Usado para obtener las playlists de amigos.',
    type: String,
    example: 'user123',
  })
  @ApiQuery({
    name: 'tipo',
    required: false,
    description: 'Tipo de búsqueda: canciones, artistas, albums, playlists. Si no se especifica, se buscarán todos.',
    enum: TipoBusqueda,
    example: TipoBusqueda.Canciones,
  })
  @Get()
  async search(
    @Query('Búsqueda') query: string,
    @Query('usuarioNick') usuarioNick: string,
    @Query('tipo') tipo?: TipoBusqueda
  ) {
    return this.searchService.search(query, usuarioNick, tipo);
  }
}
