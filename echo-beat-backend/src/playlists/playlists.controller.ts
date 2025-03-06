import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PlaylistsService } from './playlists.service';

@ApiTags('Playlist')
@Controller('playlists')
export class PlaylistsController {
  constructor(private readonly playlistsService: PlaylistsService) {}

  @ApiOperation({ summary: 'Crear una nueva playlist' })
  @ApiResponse({ status: 201, description: 'Playlist creada correctamente.' })
  @Post()
  async createPlaylist(@Body() createDto: { name: string; userId: string }) {
    return await this.playlistsService.createPlaylist(createDto);
  }

  @ApiOperation({ summary: 'Eliminar una playlist existente' })
  @ApiResponse({ status: 200, description: 'Playlist eliminada correctamente.' })
  @ApiResponse({ status: 404, description: 'No se encontró la playlist.' })
  @Delete(':playlistId')
  async deletePlaylist(@Param('playlistId') playlistId: string) {
    await this.playlistsService.deletePlaylist(playlistId);
    return { message: 'Playlist eliminada correctamente.' };
  }

  @ApiOperation({ summary: 'Obtiene todas las playlists creadas por un usuario' })
  @ApiResponse({ status: 200, description: 'Retorna un arreglo de playlists.' })
  @Get('user')
  async getPlaylistsByUser(@Param('userEmail') userEmail: string) {
    return await this.playlistsService.findAllByUser(userEmail);
  }

  @ApiOperation({ summary: 'Obtener todas las canciones de una playlist' })
  @ApiResponse({ status: 200, description: 'Devuelve todas las canciones de la playlist' })
  @ApiResponse({ status: 404, description: 'No se encontró la playlist' })
  @Get(':id/songs')
  async getSongsByPlaylist(@Param('id') id: string) {
    return await this.playlistsService.getSongsByPlaylistId(id);
  }
}