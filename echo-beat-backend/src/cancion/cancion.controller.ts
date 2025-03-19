import { Controller, Get, Post, Delete, Param, Query } from '@nestjs/common';
import { CancionService } from './cancion.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Canciones')
@Controller('cancion')
export class CancionController {
  constructor(private readonly cancionService: CancionService) {}

  @ApiOperation({ summary: 'Añadir una canción a favoritos' })
  @ApiResponse({ status: 201, description: 'Canción guardada correctamente.' })
  @ApiResponse({ status: 400, description: 'Error en la solicitud.' })
  @Post('like/:email/:songId')
  async likeSong(@Param('email') email: string, @Param('songId') songId: number) {
    return this.cancionService.likeSong(email, Number(songId));
  }

  @ApiOperation({ summary: 'Eliminar una canción de favoritos' })
  @ApiResponse({ status: 200, description: 'Canción eliminada de favoritos correctamente.' })
  @ApiResponse({ status: 400, description: 'Error en la solicitud.' })
  @Delete('unlike/:email/:songId')
  async unlikeSong(@Param('email') email: string, @Param('songId') songId: number) {
    return this.cancionService.unlikeSong(email, Number(songId));
  }

  @ApiOperation({ summary: 'Obtener todas las canciones favoritas de un usuario' })
  @ApiResponse({ status: 200, description: 'Lista de canciones obtenida correctamente.' })
  @Get('favorites')
  async getUserFavoriteSongs(@Query('email') email: string) {
    return this.cancionService.getUserFavoriteSongs(email);
  }
}
