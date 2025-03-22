import { Controller, Get, Post, Delete, Param, Body, UploadedFile, UseInterceptors, HttpCode, HttpStatus, NotFoundException, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { PlaylistsService } from './playlists.service';
import { ApiParam } from '@nestjs/swagger';


@ApiTags('Playlist')
@Controller('playlists')
export class PlaylistsController {
  constructor(private readonly playlistsService: PlaylistsService) { }

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

  @ApiOperation({
    summary: 'Crear una nueva playlist con una imagen predefinida (URL)',
    description: '⚠️ Esta API permite crear una playlist usando un enlace a una imagen predefinida (URL).'
  })
  @ApiResponse({ status: 201, description: 'Playlist creada correctamente.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o tipo de privacidad incorrecto.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  @ApiBody({
    description: 'Datos para crear una playlist con una imagen predefinida',
    schema: {
      type: 'object',
      properties: {
        emailUsuario: { type: 'string', example: 'any@example.com' },
        nombrePlaylist: { type: 'string', example: 'Mis Favoritos' },
        descripcionPlaylist: { type: 'string', example: 'Playlist con mis canciones favoritas' },
        tipoPrivacidad: { type: 'string', enum: ['publico', 'privado', 'protegido'], example: 'publico' },
        imageUrl: { type: 'string', example: 'https://example.com/path/to/image.jpg' }, // URL de la imagen
      },
    },
  })
  @Post('create-with-url')
  @HttpCode(HttpStatus.CREATED)
  async createPlaylistWithImageUrl(
    @Body() input: { emailUsuario: string; nombrePlaylist: string; descripcionPlaylist: string; tipoPrivacidad: string; imageUrl: string }
  ) {
    return this.playlistsService.createPlaylistWithImageUrl(
      input.emailUsuario,
      input.nombrePlaylist,
      input.descripcionPlaylist,
      input.tipoPrivacidad,
      input.imageUrl
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

  @ApiOperation({ summary: 'Eliminar una playlist por su ID y email de usuario' })
  @ApiResponse({ status: 200, description: 'Playlist eliminada correctamente.' })
  @ApiResponse({ status: 404, description: 'Playlist no encontrada.' })
  @ApiResponse({ status: 403, description: 'No tienes permisos para eliminar esta playlist.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  @Delete('delete')
  @HttpCode(HttpStatus.OK)
  @ApiBody({
    description: 'Parametros necesarios para eliminar una playlist',
    schema: {
      type: 'object',
      properties: {
        userEmail: { type: 'string', example: 'user@example.com' },
        idLista: { type: 'number', example: 1 },
      },
    },
  })
  async deletePlaylist(
    @Body() body: { userEmail: string; idLista: number }
  ) {
    return this.playlistsService.deletePlaylist(body.userEmail, body.idLista);
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
  async deleteSongFromPlaylist(@Body() input: { idLista: number; songId: number }) {
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

  @ApiOperation({
    summary: 'Actualizar la portada de una playlist con una imagen predefinida',
    description: 'Actualiza la portada de la playlist con la URL proporcionada si el usuario es el autor.',
  })
  @ApiResponse({ status: 200, description: 'Portada actualizada correctamente.' })
  @ApiResponse({ status: 404, description: 'Playlist no encontrada.' })
  @ApiResponse({ status: 403, description: 'No eres el autor de la playlist.' })
  @ApiResponse({ status: 400, description: 'URL de imagen incorrecta o no válida.' })
  @ApiBody({
    description: 'Datos para actualizar la portada de la playlist',
    schema: {
      type: 'object',
      properties: {
        userEmail: { type: 'string', example: 'user@example.com' },
        playlistId: { type: 'number', example: 1 },
        imageUrl: { type: 'string', example: 'https://myblobstorage.blob.core.windows.net/container/image.jpg' },
      },
    },
  })
  @Post('update-cover')
  @HttpCode(HttpStatus.OK)
  async updatePlaylistCover(
    @Body() body: { userEmail: string; playlistId: number; imageUrl: string }
  ) {
    return this.playlistsService.updatePlaylistCover(
      body.userEmail,
      body.playlistId,
      body.imageUrl
    );
  }

  @ApiOperation({
    summary: 'Actualizar la foto de una playlist a partir de su ID',
    description: 'Sube una nueva foto para una playlist existente y elimina la foto anterior si existe.',
  })
  @ApiResponse({ status: 200, description: 'Foto de la playlist actualizada correctamente.' })
  @ApiResponse({ status: 404, description: 'Lista no encontrada o la lista no es una playlist.' })
  @ApiResponse({ status: 403, description: 'No tienes permisos para actualizar esta playlist.' })
  @ApiConsumes('multipart/form-data') // Indicar que la API consume archivos
  @ApiBody({
    description: 'Datos para actualizar la foto de la playlist',
    schema: {
      type: 'object',
      properties: {
        userEmail: { type: 'string', example: 'user@example.com'},
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @Post('update-photo/:idLista')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  async updatePlaylistPhoto(
    @Param('idLista') idLista: number,  // Recibimos idLista desde los parámetros de la URL
    @Body() input: { userEmail: string },  // Recibimos userEmail desde el cuerpo
    @UploadedFile() file: Express.Multer.File,
  ) {
    return await this.playlistsService.updatePlaylistPhoto(Number(idLista), file, input.userEmail);
  }

  @ApiOperation({ summary: 'Obtener duración de la canción a partir de su id' })
  @ApiResponse({ status: 200, description: 'Duración de la canción.', type: Number })
  @ApiResponse({ status: 404, description: 'Canción no encontrada.' })
  @ApiParam({ name: 'idSong', type: Number, description: 'Identificador de la canción' })
  @Get(':idSong')
  @HttpCode(HttpStatus.OK)
  async getSongLength(@Param('idSong', ParseIntPipe) idSong: number): Promise<number> {
    return this.playlistsService.getSongLength(idSong);
  }

  @ApiOperation({ summary: 'Obtener listas liked por un usuario' })
  @ApiResponse({
    status: 200,
    description: 'Listas liked por el usuario',
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @Get('liked/:email') // Esta ruta recibe un `email` como parámetro
  async getLikedLists(@Param('email') email: string) {
    // Llamamos al servicio para obtener las listas liked por el usuario
    const likedLists = await this.playlistsService.getLikedListsByUser(email);

    // Si no encontramos listas liked, lanzamos una excepción NotFoundException
    if (!likedLists.length) {
      throw new NotFoundException('No se encontraron listas liked para este usuario');
    }

    return likedLists;
  }

  @ApiOperation({ summary: 'Dar like a una lista de reproducción' })
  @ApiResponse({
    status: 200,
    description: 'Like agregado a la lista correctamente.',
  })
  @ApiResponse({
    status: 404,
    description: 'Lista no encontrada o usuario no registrado.',
  })
  @Post('like/:email/:idLista')
  async addLike(@Param('email') email: string, @Param('idLista') idLista: number) {
    const likeResponse = await this.playlistsService.addLikeToPlaylist(email, idLista);
    return likeResponse;
  }

  @ApiOperation({ summary: 'Quitar like de una lista de reproducción' })
  @ApiResponse({
    status: 200,
    description: 'Like quitado de la lista correctamente.',
  })
  @ApiResponse({
    status: 404,
    description: 'Lista no encontrada o usuario no registrado.',
  })
  @Delete('like/:email/:idLista')
  async removeLike(@Param('email') email: string, @Param('idLista') idLista: number) {
    const removeResponse = await this.playlistsService.removeLikeFromPlaylist(email, idLista);
    return removeResponse;
  }
  
  @ApiOperation({ summary: 'Obtener detalles de una canción y sus autores por ID' })
  @ApiResponse({ status: 200, description: 'Detalles de la canción con sus autores.' })
  @ApiResponse({ status: 404, description: 'Canción no encontrada o el ID no es válido.' })
  @Get('song-details/:idCancion')
  @HttpCode(HttpStatus.OK)
  async getSongDetailsWithAuthors(@Param('idCancion') idCancion: string) {
    // Convertimos el parámetro idCancion a número antes de pasarlo al servicio
    const songId = parseInt(idCancion, 10);

    if (isNaN(songId)) {
      throw new NotFoundException('El ID de la canción no es válido.');
    }

    return this.playlistsService.getSongDetailsWithAuthors(songId);
  }
}
