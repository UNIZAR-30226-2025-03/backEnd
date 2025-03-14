import { Controller, Get, Post, Delete, Param, Body, UploadedFile, UseInterceptors, HttpCode, HttpStatus, NotFoundException} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { PlaylistsService } from './playlists.service';

@ApiTags('Playlist')
@Controller('playlists')
export class PlaylistsController {
  constructor(private readonly playlistsService: PlaylistsService) {}

  @ApiOperation({ 
    summary: 'Crear una nueva playlist',
    description: '⚠️ Esta API no puede probarse en Swagger porque requiere la carga de archivos mediante `multipart/form-data` desde una aplicación cliente.'
   })
   @ApiResponse({ status: 201, description: 'Playlist creada correctamente.' })
   @ApiResponse({ status: 400, description: 'Datos inválidos o tipo de privacidad incorrecto.' })
   @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
   @ApiConsumes('multipart/form-data') // Indicar que la API consume archivos
   @ApiBody({
     description: 'Datos para crear una playlist',
     schema: {
       type: 'object',
       properties: {
        emailUsuario: { type: 'string', example: 'any@example.com' },
        nombrePlaylist: { type: 'string', example: 'Mis Favoritos' },
        descripcionPlaylist: { type: 'string', example: 'Playlist con mis canciones favoritas' },
        tipoPrivacidad: { type: 'string', enum: ['publico', 'privado', 'protegido'], example: 'publico' },
        file: { type: 'string', format: 'binary' },
       },
     },
   })
   @Post('create')
   @HttpCode(HttpStatus.CREATED)
   @UseInterceptors(FileInterceptor('file'))
   async createPlaylist(
     @Body() input: { emailUsuario: string; nombrePlaylist: string; descripcionPlaylist: string; tipoPrivacidad: string },
     @UploadedFile() file: Express.Multer.File
   ) {
     return this.playlistsService.createPlaylist(
       input.emailUsuario,
       input.nombrePlaylist,
       input.descripcionPlaylist,
       input.tipoPrivacidad,
       file
     );
   }

  @ApiOperation({ summary: 'Obtiene todas las playlists creadas por un usuario' })
  @ApiResponse({ status: 200, description: 'Retorna un arreglo de playlists.' })
  @Get('user/:userEmail')
  async getPlaylistsByUser(@Param('userEmail') userEmail: string) {
    return await this.playlistsService.findAllByUser(userEmail);
  }

  @ApiOperation({ summary: 'Obtener todas las canciones de una playlist' })
  @ApiResponse({ status: 200, description: 'Devuelve todas las canciones de la playlist' })
  @ApiResponse({ status: 404, description: 'No se encontró la playlist' })
  @Get(':id/songs')
  async getSongsByList(@Param('id') id: string) {
    return await this.playlistsService.getSongsByListId(id);
  }

  @ApiOperation({ summary: 'Eliminar una playlist por su ID' })
  @ApiResponse({ status: 200, description: 'Playlist eliminada correctamente.' })
  @ApiResponse({ status: 404, description: 'Playlist no encontrada.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  @Delete('delete/:idLista')
  @HttpCode(HttpStatus.OK)
  async deletePlaylist(@Param('idLista') idLista: string) {
    return this.playlistsService.deletePlaylist(Number(idLista));
  }

  @ApiOperation({ summary: 'Obtener todas las URLs de imágenes del contenedor predeterminado de lista' })
  @ApiResponse({ status: 200, description: 'Lista de URLs de imágenes obtenidas correctamente.' })
  @ApiResponse({ status: 500, description: 'Error interno al acceder al contenedor de Azure.' })
  @Get('default-photos')
  async getAllImageUrls() {
    return this.playlistsService.getAllListDefaultImageUrls();
  }

  @ApiOperation({ summary: 'Añadir una canción a la playlist en la última posición' })
  @ApiResponse({ status: 200, description: 'Canción añadida correctamente a la playlist.' })
  @ApiResponse({ status: 404, description: 'Playlist o canción no encontrada.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  @ApiBody({
    description: 'Datos necesarios para añadir una canción a la playlist',
    schema: {
      type: 'object',
      properties: {
        idLista: { type: 'number', example: 42 },
        songId: { type: 'number', example: 15 },
      },
    },
  })
  @Post('add-song/:idLista')
  @HttpCode(HttpStatus.OK)
  async addSongToPlaylist(
    @Body() input: { idLista: number; songId: number }
  ) {
    return this.playlistsService.addSongToPlaylist(input.idLista, input.songId);
  }

  @ApiOperation({ summary: 'Eliminar una canción de la playlist y ajustar las posiciones' })
  @ApiResponse({ status: 200, description: 'Canción eliminada correctamente y posiciones ajustadas.' })
  @ApiResponse({ status: 404, description: 'Lista de reproducción o canción no encontrada.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  @ApiBody({
    description: 'Datos necesarios para eliminar una canción de la playlist',
    schema: {
      type: 'object',
      properties: {
        idLista: { type: 'number', example: 42 },
        songId: { type: 'number', example: 15 },
      },
    },
  })
  @Delete('delete-song/:idLista')
  @HttpCode(HttpStatus.OK)
  async deleteSongFromPlaylist(@Body() input: { idLista: number; songId: number }) 
  {
    return this.playlistsService.deleteSongFromPlaylist(input.idLista, input.songId);
  }

  @ApiOperation({ summary: 'Obtener detalles de una playlist a partir de su ID' })
  @ApiResponse({ status: 200, description: 'Playlist encontrada.', type: Object })
  @ApiResponse({ status: 404, description: 'Playlist no encontrada.' })
  @Get('lista/:idList')
  @HttpCode(HttpStatus.OK)
  async getListDetails(@Param('idList') idList: string) {
    // Convertir idList a número
    const ListId = Number(idList);

    if (isNaN(ListId)) {
      throw new NotFoundException('ID de la playlist no es válida.');
    }

    return this.playlistsService.getListDetails(ListId);
  }

  @ApiOperation({ summary: 'Obtener detalles de un álbum a partir de su ID de lista' })
  @ApiResponse({ status: 200, description: 'Álbum encontrado.', type: Object })
  @ApiResponse({ status: 404, description: 'Álbum no encontrado.' })
  @Get('album/:idLista')
  @HttpCode(HttpStatus.OK)
  async getAlbumDetails(@Param('idLista') idLista: string) {
    // Convertir idList a número
    const ListId = Number(idLista);

    if (isNaN(ListId)) {
      throw new NotFoundException('ID del álbum no es válido.');
    }

    return this.playlistsService.getAlbumDetails(ListId);
  }

  @ApiOperation({ summary: 'Obtener detalles de una playlist a partir de su ID de playlist' })
  @ApiResponse({ status: 200, description: 'Playlist encontrada.', type: Object })
  @ApiResponse({ status: 404, description: 'Playlist no encontrada.' })
  @Get('playlist/:idPlaylist')
  @HttpCode(HttpStatus.OK)
  async getPlaylistDetails(@Param('idPlaylist') idPlaylist: string) {
        // Convertir idList a número
    const ListId = Number(idPlaylist);

    if (isNaN(ListId)) {
      throw new NotFoundException('ID de la playlist no es válido.');
    }

    return this.playlistsService.getPlaylistDetails(ListId);
  }
}