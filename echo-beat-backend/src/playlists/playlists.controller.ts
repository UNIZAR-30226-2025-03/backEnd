import { Controller, Get, Post, Delete, Param, Body, UploadedFile, UseInterceptors, HttpCode, HttpStatus, NotFoundException, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody, ApiQuery } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { PlaylistsService } from './playlists.service';
import { ApiParam } from '@nestjs/swagger';


@ApiTags('Playlist')
@Controller('playlists')
export class PlaylistsController {
  constructor(private readonly playlistsService: PlaylistsService) { }

  /**
 * Crea una nueva playlist con una imagen subida.
 * 
 * @param input - Datos de la playlist: email del usuario, nombre, descripción y tipo de privacidad.
 * @param file - Archivo de imagen de la portada.
 * @returns La playlist creada.
 */
  @ApiOperation({
    summary: 'Crear una nueva playlist'
  })
  @ApiResponse({ status: 201, description: 'Playlist creada correctamente.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o tipo de privacidad incorrecto.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  @ApiConsumes('multipart/form-data')
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

  /**
 * Crea una nueva playlist con una imagen proporcionada por URL.
 * 
 * @param input - Datos de la playlist y la URL de la imagen.
 * @returns La playlist creada.
 */
  @ApiOperation({
    summary: 'Crear una nueva playlist con una imagen predefinida (URL)',
    description: 'Esta API permite crear una playlist usando un enlace a una imagen predefinida (URL).'
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
        imageUrl: { type: 'string', example: 'https://example.com/path/to/image.jpg' },
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

  /**
   * Obtiene todas las playlists de un usuario.
   * 
   * @param userEmail - Email del usuario.
   * @returns Lista de playlists creadas por el usuario.
   */
  @ApiOperation({ summary: 'Obtiene todas las playlists creadas por un usuario' })
  @ApiResponse({ status: 200, description: 'Retorna un arreglo de playlists.' })
  @Get('user/:userEmail')
  async getPlaylistsByUser(@Param('userEmail') userEmail: string) {
    return await this.playlistsService.findAllByUser(userEmail);
  }

  /**
 * Devuelve todas las canciones asociadas a una playlist.
 * 
 * @param id - ID de la playlist.
 * @returns Canciones en la playlist.
 */
  @ApiOperation({ summary: 'Obtener todas las canciones de una playlist' })
  @ApiResponse({ status: 200, description: 'Devuelve todas las canciones de la playlist' })
  @ApiResponse({ status: 404, description: 'No se encontró la playlist' })
  @Get(':id/songs')
  async getSongsByList(@Param('id') id: string) {
    return await this.playlistsService.getSongsByListId(id);
  }

  /**
 * Elimina una playlist específica de un usuario.
 * 
 * @param body - Email del usuario y ID de la playlist.
 * @returns Mensaje de éxito o error.
 */
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

  /**
   * Obtiene todas las imágenes por defecto para playlists desde Azure.
   * 
   * @returns Lista de URLs.
   */
  @ApiOperation({ summary: 'Obtener todas las URLs de imágenes del contenedor predeterminado de lista' })
  @ApiResponse({ status: 200, description: 'Lista de URLs de imágenes obtenidas correctamente.' })
  @ApiResponse({ status: 500, description: 'Error interno al acceder al contenedor de Azure.' })
  @Get('default-photos')
  async getAllImageUrls() {
    return this.playlistsService.getAllListDefaultImageUrls();
  }

  /**
 * Añade una canción al final de una playlist.
 * 
 * @param input - ID de la playlist y ID de la canción.
 * @returns Detalles de la canción añadida.
 */
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

  /**
 * Elimina una canción de la playlist y reordena las posiciones.
 * 
 * @param input - ID de la playlist y canción.
 * @returns Mensaje de éxito.
 */
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

  /**
 * Obtiene los detalles de una lista.
 * 
 * @param idList - ID de la lista.
 * @returns Información de la lista.
 */
  @ApiOperation({ summary: 'Obtener detalles de una lista a partir de su ID' })
  @ApiResponse({ status: 200, description: 'lista encontrada.', type: Object })
  @ApiResponse({ status: 404, description: 'lista no encontrada.' })
  @Get('lista/:idList')
  @HttpCode(HttpStatus.OK)
  async getListDetails(@Param('idList') idList: string) {
    const ListId = Number(idList);

    if (isNaN(ListId)) {
      throw new NotFoundException('ID de la playlist no es válida.');
    }

    return this.playlistsService.getListDetails(ListId);
  }

  /**
 * Obtiene los detalles de un álbum.
 * 
 * @param idLista - ID de la lista asociada al álbum.
 * @returns Detalles del álbum.
 */
  @ApiOperation({ summary: 'Obtener detalles de un álbum a partir de su ID de lista' })
  @ApiParam({ name: 'idLista', type: Number, description: 'ID de la lista asociada al álbum' })
  @ApiResponse({
    status: 200,
    description: 'Álbum encontrado.',
    schema: {
      example: {
        id: 1,
        nombre: 'Mi Álbum',
        autor: 'Nombre del Artista',
        numCanciones: 10,
        numLikes: 123,
        numReproducciones: 4567,
        portada: 'https://miapp.com/portadas/album1.jpg',
        fechaLanzamiento: '2025-03-25T12:00:00.000Z'
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Álbum no encontrado.' })
  @Get('album/:idLista')
  @HttpCode(HttpStatus.OK)
  async getAlbumDetails(@Param('idLista') idLista: string) {
    const listId = Number(idLista);

    if (isNaN(listId) || listId <= 0) {
      throw new NotFoundException('El ID del álbum no es válido.');
    }

    return this.playlistsService.getAlbumDetails(listId);
  }

  /**
   * Obtiene los detalles de una playlist.
   * 
   * @param idPlaylist - ID de la playlist.
   * @returns Detalles completos de la playlist.
   */
  @ApiOperation({ summary: 'Obtener detalles de una playlist a partir de su ID de playlist' })
  @ApiResponse({ status: 200, description: 'Playlist encontrada.', type: Object })
  @ApiResponse({ status: 404, description: 'Playlist no encontrada.' })
  @Get('playlist/:idPlaylist')
  @HttpCode(HttpStatus.OK)
  async getPlaylistDetails(@Param('idPlaylist') idPlaylist: string) {
    const ListId = Number(idPlaylist);

    if (isNaN(ListId)) {
      throw new NotFoundException('ID de la playlist no es válido.');
    }

    return this.playlistsService.getPlaylistDetails(ListId);
  }

  /**
 * Actualiza la portada de una playlist con una imagen predeterminada.
 * 
 * @param body - Email del usuario, ID de la playlist e imagen URL.
 * @returns Resultado de la actualización.
 */
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

  /**
 * Actualiza la foto de portada de una playlist subiendo un archivo.
 * 
 * @param idLista - ID de la playlist.
 * @param input - Email del usuario.
 * @param file - Imagen a subir.
 * @returns Resultado de la actualización.
 */
  @ApiOperation({
    summary: 'Actualizar la foto de una playlist a partir de su ID',
    description: 'Sube una nueva foto para una playlist existente y elimina la foto anterior si existe.',
  })
  @ApiResponse({ status: 200, description: 'Foto de la playlist actualizada correctamente.' })
  @ApiResponse({ status: 404, description: 'Lista no encontrada o la lista no es una playlist.' })
  @ApiResponse({ status: 403, description: 'No tienes permisos para actualizar esta playlist.' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Datos para actualizar la foto de la playlist',
    schema: {
      type: 'object',
      properties: {
        userEmail: { type: 'string', example: 'user@example.com' },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @Post('update-photo/:idLista')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  async updatePlaylistPhoto(
    @Param('idLista') idLista: number,
    @Body() input: { userEmail: string },
    @UploadedFile() file: Express.Multer.File,
  ) {
    return await this.playlistsService.updatePlaylistPhoto(Number(idLista), file, input.userEmail);
  }

  /**
 * Devuelve la duración de una canción.
 * 
 * @param idSong - ID de la canción.
 * @returns Duración en segundos.
 */
  @ApiOperation({ summary: 'Obtener duración de la canción a partir de su id' })
  @ApiResponse({ status: 200, description: 'Duración de la canción.', type: Number })
  @ApiResponse({ status: 404, description: 'Canción no encontrada.' })
  @ApiParam({ name: 'idSong', type: Number, description: 'Identificador de la canción' })
  @Get(':idSong')
  @HttpCode(HttpStatus.OK)
  async getSongLength(@Param('idSong', ParseIntPipe) idSong: number): Promise<number> {
    return this.playlistsService.getSongLength(idSong);
  }

  /**
 * Obtiene las listas favoritas de un usuario.
 * 
 * @param email - Email del usuario.
 * @returns Listas liked.
 */
  @ApiOperation({ summary: 'Obtener listas liked por un usuario' })
  @ApiResponse({
    status: 200,
    description: 'Listas liked por el usuario',
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @Get('liked/:email')
  async getLikedLists(@Param('email') email: string) {
    const likedLists = await this.playlistsService.getLikedListsByUser(email);

    if (!likedLists.length) {
      throw new NotFoundException('No se encontraron listas liked para este usuario');
    }

    return likedLists;
  }

  /**
 * Añade un like a una playlist.
 * 
 * @param email - Email del usuario.
 * @param idLista - ID de la playlist.
 * @returns Confirmación del like.
 */
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

  /**
 * Elimina un like de una playlist.
 * 
 * @param email - Email del usuario.
 * @param idLista - ID de la playlist.
 * @returns Confirmación de eliminación del like.
 */
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

  /**
 * Devuelve detalles de una canción con sus autores.
 * 
 * @param idCancion - ID de la canción.
 * @returns Detalles y autores.
 */
  @ApiOperation({ summary: 'Obtener detalles de una canción y sus autores por ID' })
  @ApiResponse({ status: 200, description: 'Detalles de la canción con sus autores.' })
  @ApiResponse({ status: 404, description: 'Canción no encontrada o el ID no es válido.' })
  @Get('song-details/:idCancion')
  @HttpCode(HttpStatus.OK)
  async getSongDetailsWithAuthors(@Param('idCancion') idCancion: string) {
    const songId = parseInt(idCancion, 10);

    if (isNaN(songId)) {
      throw new NotFoundException('El ID de la canción no es válido.');
    }

    return this.playlistsService.getSongDetailsWithAuthors(songId);
  }

  /**
   * Reordena las canciones dentro de una playlist.
   * 
   * @param body - ID de la playlist y nuevo JSON con orden.
   * @returns Confirmación de orden actualizado.
   */
  @ApiOperation({ summary: 'Reordenar canciones de una playlist' })
  @ApiResponse({ status: 200, description: 'Orden de canciones actualizado correctamente.' })
  @ApiResponse({ status: 400, description: 'Formato inválido del JSON.' })
  @ApiResponse({ status: 404, description: 'La playlist no existe.' })
  @ApiBody({
    description: 'ID de la playlist y nuevo orden de canciones',
    schema: {
      type: 'object',
      properties: {
        idPlaylist: { type: 'number', example: 1 },
        cancionesJson: {
          type: 'object',
          example: {
            canciones: [
              {
                id: 1,
                nombre: 'Canción 1',
                duracion: 180,
                numReproducciones: 20,
                numFavoritos: 5,
                portada: 'URL',
              },
              {
                id: 2,
                nombre: 'Canción 2',
                duracion: 200,
                numReproducciones: 15,
                numFavoritos: 3,
                portada: 'URL',
              },
            ],
          },
        },
      },
    },
  })
  @Post('reordenar-canciones')
  @HttpCode(HttpStatus.OK)
  async reordenarCanciones(
    @Body()
    body: {
      idPlaylist: number;
      cancionesJson: any;
    },
  ) {
    return this.playlistsService.reordenarCancionesDePlaylist(body.idPlaylist, body.cancionesJson);
  }

  /**
 * Devuelve las canciones de una playlist ordenadas por un criterio.
 * 
 * @param idPlaylist - ID de la playlist.
 * @param tipoFiltro - Tipo de orden: posición, nombre o reproducciones.
 * @returns Canciones ordenadas.
 */
  @Get('ordenar-canciones/:idPlaylist/:tipoFiltro')
  @ApiOperation({
    summary: 'Obtener canciones de una playlist ordenadas según el filtro',
    description: `Ordena las canciones de una playlist según el tipo de filtro proporcionado:
    - 0: Orden por posición original en la playlist
    - 1: Orden alfabético por nombre
    - 2: Orden por número de reproducciones (mayor a menor)`,
  })
  @ApiParam({ name: 'idPlaylist', type: Number, example: 12, description: 'ID de la playlist' })
  @ApiParam({
    name: 'tipoFiltro',
    type: Number,
    example: 2,
    description: `Tipo de filtro:
    - 0: Orden por posición
    - 1: Orden por nombre
    - 2: Orden por reproducciones`,
  })
  @ApiResponse({ status: 200, description: 'Canciones ordenadas correctamente.' })
  @ApiResponse({ status: 400, description: 'Filtro inválido o error de parámetros.' })
  async ordenarCancionesDePlaylist(
    @Param('idPlaylist', ParseIntPipe) idPlaylist: number,
    @Param('tipoFiltro', ParseIntPipe) tipoFiltro: number,
  ) {
    return this.playlistsService.ordenarCancionesDePlaylist(idPlaylist, tipoFiltro);
  }

  /**
   * Actualiza el nombre de una playlist.
   * 
   * @param body - Email, ID y nuevo nombre.
   * @returns Confirmación del cambio.
   */
  @ApiOperation({ summary: 'Cambiar el nombre de una playlist' })
  @ApiResponse({ status: 200, description: 'Nombre actualizado correctamente.' })
  @ApiResponse({ status: 400, description: 'Error al actualizar el nombre.' })
  @ApiBody({
    description: 'Datos para actualizar el nombre',
    schema: {
      type: 'object',
      properties: {
        userEmail: { type: 'string', example: 'usuario@example.com' },
        idPlaylist: { type: 'number', example: 1 },
        nuevoNombre: { type: 'string', example: 'Mis nuevas canciones' },
      },
    },
  })
  @Post('update-nombre')
  async actualizarNombrePlaylist(@Body() body: { userEmail: string, idPlaylist: number, nuevoNombre: string }) {
    return this.playlistsService.updatePlaylistName(body.userEmail, body.idPlaylist, body.nuevoNombre);
  }

  /**
   * Actualiza la descripción de una playlist.
   * 
   * @param body - Email, ID y nueva descripción.
   * @returns Confirmación del cambio.
   */
  @ApiOperation({ summary: 'Cambiar la descripción de una playlist' })
  @ApiResponse({ status: 200, description: 'Descripción actualizada correctamente.' })
  @ApiResponse({ status: 400, description: 'Error al actualizar la descripción.' })
  @ApiBody({
    description: 'Datos para actualizar la descripción',
    schema: {
      type: 'object',
      properties: {
        userEmail: { type: 'string', example: 'usuario@example.com' },
        idPlaylist: { type: 'number', example: 1 },
        nuevaDescripcion: { type: 'string', example: 'Una playlist llena de temazos' },
      },
    },
  })
  @Post('update-descripcion')
  async actualizarDescripcionPlaylist(@Body() body: { userEmail: string, idPlaylist: number, nuevaDescripcion: string }) {
    return this.playlistsService.updatePlaylistDescription(body.userEmail, body.idPlaylist, body.nuevaDescripcion);
  }

  /**
   * Cambia la privacidad de una playlist.
   * 
   * @param body - Email, ID y nuevo tipo de privacidad.
   * @returns Confirmación del cambio.
   */
  @ApiOperation({ summary: 'Cambiar la privacidad de una playlist' })
  @ApiResponse({ status: 200, description: 'Privacidad actualizada correctamente.' })
  @ApiResponse({ status: 400, description: 'Error al actualizar la privacidad.' })
  @ApiBody({
    description: 'Datos para actualizar la privacidad',
    schema: {
      type: 'object',
      properties: {
        userEmail: { type: 'string', example: 'usuario@example.com' },
        idPlaylist: { type: 'number', example: 1 },
        nuevoTipoPrivacidad: { type: 'string', enum: ['publico', 'privado', 'protegido'], example: 'publico' },
      },
    },
  })
  @Post('update-privacidad')
  async actualizarPrivacidadPlaylist(@Body() body: { userEmail: string, idPlaylist: number, nuevoTipoPrivacidad: string }) {
    return this.playlistsService.updatePlaylistPrivacy(body.userEmail, body.idPlaylist, body.nuevoTipoPrivacidad);
  }

}
