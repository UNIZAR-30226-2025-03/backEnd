import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { AzureBlobService } from '../azure-blob/azure-blob.service';
import { PlaylistsService } from '../playlists/playlists.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
@Injectable()
export class StreamingGateway {
  @WebSocketServer()
  server: Server;

  private readonly CHUNK_SIZE = 64 * 1024; // 64KB

  constructor(
    private azureBlobService: AzureBlobService,
    private playlistsService: PlaylistsService
  ) {}

  /**
   * Inicia la reproducción de la primera canción de la playlist.
   * Se obtiene el nombre de la primera canción usando 'getFirstSongInPlaylist'.
   */
  @SubscribeMessage('startStream')
  async handleStartStream(client: Socket, payload: { playlistId: string }) {
    try {
      // 1. Obtiene la primera canción de la playlist
      const songName = await this.playlistsService.getFirstSongInPlaylist(payload.playlistId);
      if (!songName) {
        client.emit('error', 'No se encontró la primera canción en la playlist');
        return;
      }

      // 2. Pide el stream de Azure Blob usando el nombre de la canción
      const containerName = 'cancionespsoft';
      const nodeStream = await this.azureBlobService.getStream(containerName, songName);

      if (!nodeStream) {
        client.emit('error', 'No se pudo obtener el stream');
        return;
      }

      // 3. Envía el stream al cliente en chunks
      nodeStream.on('data', (chunk: Buffer) => {
        client.emit('audioChunk', { data: chunk, filename: songName });
      });

      nodeStream.on('end', () => {
        client.emit('streamComplete');
      });

      nodeStream.on('error', (error: Error) => {
        console.error('Error en el streaming:', error);
        client.emit('error', 'Error al transmitir la canción');
      });
    } catch (error) {
      console.error('Error al procesar la solicitud de streaming:', error);
      client.emit('error', 'Error al transmitir la canción');
    }
  }

  /**
   * Avanza a la siguiente canción de la playlist.
   * Se basa en 'getNextSongInPlaylist' para obtener la siguiente.
   */
  @SubscribeMessage('nextStream')
  async handleNextStream(client: Socket, payload: { playlistId: string }) {
    try {
      // 1. Obtiene la siguiente canción de la playlist
      const songName = await this.playlistsService.getNextSongInPlaylist(payload.playlistId);
      if (!songName) {
        client.emit('error', 'No se encontró la siguiente canción en la playlist');
        return;
      }

      // 2. Obtiene el stream de Azure Blob
      const containerName = 'cancionespsoft';
      const nodeStream = await this.azureBlobService.getStream(containerName, songName);

      if (!nodeStream) {
        client.emit('error', 'No se pudo obtener el stream');
        return;
      }

      // 3. Envía la canción al cliente en chunks
      nodeStream.on('data', (chunk: Buffer) => {
        client.emit('audioChunk', { data: chunk, filename: songName });
      });

      nodeStream.on('end', () => {
        client.emit('streamComplete');
      });

      nodeStream.on('error', (error: Error) => {
        console.error('Error en el streaming:', error);
        client.emit('error', 'Error al transmitir la canción');
      });
    } catch (error) {
      console.error('Error al procesar la siguiente canción:', error);
      client.emit('error', 'Error al transmitir la canción');
    }
  }

  @SubscribeMessage('pauseStream')
  handlePauseStream(client: Socket) {
    // Lógica de pausa si aplica
    client.emit('streamPaused');
  }

  @SubscribeMessage('resumeStream')
  handleResumeStream(client: Socket) {
    // Lógica de reanudación si aplica
    client.emit('streamResumed');
  }
}