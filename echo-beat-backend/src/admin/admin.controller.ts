import { Controller, Get, Post, Patch, Delete, Param, Body, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { AdminService } from './admin.service';

class CreatePlaylistDto {
  name: string;
  description: string;
  isPublic: boolean;
}

class UpdatePlaylistDto {
  name?: string;
  description?: string;
  isPublic?: boolean;
}

class AddSongDto {
  songId: number;
}

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) { }

  /**
* Obtiene todas las listas de reproducción predefinidas creadas por el administrador.
* 
* @returns Arreglo de playlists predefinidas.
*/
  @Get('playlists')
  @ApiOperation({
    summary: 'Obtener listas de reproducción predefinidas',
    description: 'Devuelve todas las listas de reproducción administradas por el administrador del sistema.'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Listas encontradas correctamente',
    type: [Object]
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'No autorizado' })
  async getPredefinedPlaylists() {

    return this.adminService.findAllPredefinedPlaylists();
  }

  /**
* Crea una nueva lista de reproducción predefinida del sistema.
* 
* @param createPlaylistDto - Objeto con nombre, descripción y privacidad de la playlist.
* @returns Detalles de la playlist creada.
*/
  @Post('playlists')
  @ApiOperation({
    summary: 'Crear lista de reproducción predefinida',
    description: 'Crea una nueva lista de reproducción administrada por el sistema'
  })
  @ApiBody({
    description: 'Datos para la nueva lista',
    type: CreatePlaylistDto
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Lista creada correctamente'
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'No autorizado' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Datos inválidos' })
  async createPredefinedPlaylist(@Body() createPlaylistDto: CreatePlaylistDto) {
    return this.adminService.createPredefinedPlaylist(createPlaylistDto);
  }

  /**
* Actualiza los datos de una lista de reproducción predefinida.
* 
* @param id - ID de la playlist a actualizar.
* @param updatePlaylistDto - Nuevos datos de nombre, descripción o privacidad.
* @returns Playlist actualizada.
*/
  @Patch('playlists/:id')
  @ApiOperation({
    summary: 'Actualizar lista predefinida',
    description: 'Modifica una lista de reproducción existente administrada por el sistema'
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador único de la lista de reproducción'
  })
  @ApiBody({
    description: 'Datos para actualizar',
    type: UpdatePlaylistDto
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista actualizada correctamente'
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Lista no encontrada' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'No autorizado' })
  async updatePredefinedPlaylist(
    @Param('id') id: string,
    @Body() updatePlaylistDto: UpdatePlaylistDto
  ) {
    return this.adminService.updatePredefinedPlaylist(parseInt(id), updatePlaylistDto);
  }

  /**
* Elimina una lista de reproducción predefinida.
* 
* @param id - ID de la playlist a eliminar.
* @returns Mensaje de confirmación.
*/
  @Delete('playlists/:id')
  @ApiOperation({
    summary: 'Eliminar lista predefinida',
    description: 'Elimina permanentemente una lista de reproducción administrada por el sistema'
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador único de la lista de reproducción a eliminar'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista eliminada correctamente'
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Lista no encontrada' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'No autorizado' })
  async deletePredefinedPlaylist(@Param('id') id: string) {
    return this.adminService.deletePredefinedPlaylist(parseInt(id));
  }

  /**
* Añade una canción existente a una playlist predefinida.
* 
* @param id - ID de la playlist.
* @param addSongDto - Contiene el ID de la canción a añadir.
* @returns Canción añadida con su nueva posición.
*/
  @Post('playlists/:id/songs')
  @ApiOperation({
    summary: 'Añadir canción a lista',
    description: 'Agrega una canción existente a una lista de reproducción predefinida'
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador único de la lista de reproducción'
  })
  @ApiBody({
    description: 'Datos de la canción a añadir',
    type: AddSongDto
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Canción añadida correctamente a la lista'
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Lista o canción no encontrada' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'No autorizado' })
  async addSongToPlaylist(
    @Param('id') id: string,
    @Body() addSongDto: AddSongDto
  ) {
    return this.adminService.addSongToPlaylist(parseInt(id), addSongDto.songId);
  }

  /**
* Elimina una canción de una playlist predefinida.
* 
* @param id - ID de la playlist.
* @param songId - ID de la canción a eliminar.
* @returns Confirmación de eliminación.
*/
  @Delete('playlists/:id/songs/:songId')
  @ApiOperation({
    summary: 'Eliminar canción de lista',
    description: 'Elimina una canción específica de una lista de reproducción predefinida'
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador único de la lista de reproducción'
  })
  @ApiParam({
    name: 'songId',
    description: 'Identificador único de la canción a eliminar'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Canción eliminada correctamente de la lista'
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Lista o canción no encontrada' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'No autorizado' })
  async removeSongFromPlaylist(
    @Param('id') id: string,
    @Param('songId') songId: string
  ) {
    return this.adminService.removeSongFromPlaylist(parseInt(id), parseInt(songId));
  }
}