import { Controller, Get, Param, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PlaylistsService } from './playlists.service';
import { StreamingService } from '../streaming/streaming.service';
import { Response } from 'express';
import { Readable } from 'stream';

@ApiTags('Playlist')
@Controller('playlists')
export class PlaylistsController {
  private currentStream: Readable | null = null;
  private currentResponse: Response | null = null;

  constructor(
    private readonly playlistsService: PlaylistsService,
    private readonly streamingService: StreamingService
  ) {}

  @ApiOperation({ summary: 'Inicia la reproducción de la primera canción de la playlist' })
  @ApiResponse({ status: 200, description: 'Transmisión exitosa.' })
  @ApiResponse({ status: 404, description: 'No se encontró ninguna canción en la playlist.' })
  @Get(':playlistId/start')
  async startPlaylist(@Param('playlistId') playlistId: string, @Res() res: Response) {
    // 1. Cancelar flujo previo
    this.cancelCurrentStream();

    // 2. Consulta la primera canción de la playlist
    const firstSong = await this.playlistsService.getFirstSongInPlaylist(playlistId);
    if (!firstSong) {
      return res.status(404).send('No se encontró la primera canción en la playlist.');
    }

    // 3. Delegar el streaming al servicio correspondiente
    const stream = await this.streamingService.getStream('cancionespsoft', firstSong);
    this.currentStream = stream;
    this.currentResponse = res;
    stream.pipe(res);
  }

  @ApiOperation({ summary: 'Pasa a la siguiente canción en la playlist' })
  @ApiResponse({ status: 200, description: 'Transmisión exitosa.' })
  @ApiResponse({ status: 404, description: 'No se encontró la siguiente canción.' })
  @Get(':playlistId/next')
  async nextPlaylistSong(@Param('playlistId') playlistId: string, @Res() res: Response) {
    // 1. Cancelar flujo previo
    this.cancelCurrentStream();

    // 2. Consulta la siguiente canción
    const nextSong = await this.playlistsService.getNextSongInPlaylist(playlistId);
    if (!nextSong) {
      return res.status(404).send('No se encontró la siguiente canción en la playlist.');
    }

    // 3. Delegar streaming al servicio de Streaming
    const stream = await this.streamingService.getStream('cancionespsoft', nextSong);
    this.currentStream = stream;
    this.currentResponse = res;
    stream.pipe(res);
  }

  private cancelCurrentStream() {
    if (this.currentStream) {
      this.currentStream.unpipe();
      this.currentStream.destroy();
      this.currentStream = null;
    }
    if (this.currentResponse) {
      this.currentResponse.end();
      this.currentResponse = null;
    }
  }
}