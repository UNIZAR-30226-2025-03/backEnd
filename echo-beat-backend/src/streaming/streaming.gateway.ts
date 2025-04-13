import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { AzureBlobService } from '../azure-blob/azure-blob.service';
import { PlaylistsService } from '../playlists/playlists.service';
import { EstadoUsuarioService } from 'src/estado-usuario/estado-usuario.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
@Injectable()
export class StreamingGateway {

  /**
 * Servidor WebSocket
 */
  @WebSocketServer()
  server: Server;

  /**
 * Tamaño del chunk en bytes (64 KB) para transmitir el audio por partes.
 */
  private readonly CHUNK_SIZE = 64 * 1024; // 64KB

  constructor(
    private azureBlobService: AzureBlobService,
    private playlistsService: PlaylistsService,
    private estadoUsuarioService: EstadoUsuarioService
  ) { }



  /**
   * Maneja la conexión de un nuevo cliente.
   * @param client Cliente conectado
   */
  handleConnection(client: Socket) {
    console.log('Cliente conectado:', client.id);
  }

  /**
   * Maneja el evento 'startStream', encargado de transmitir una canción en chunks.
   * @param client Cliente que solicita el streaming
   * @param payload Objeto que contiene el `songId` y el `userId`
   */
  @SubscribeMessage('startStream')
  async handleStartSong(client: Socket, payload: { songId: number, userId: string }) {
    console.log('Evento startStream recibido para canción:', payload.songId);
    try {
      if (!payload.songId) {
        client.emit('error', 'No se proporcionó el nombre de la canción');
        return;
      }

      if (!payload.userId) {
        client.emit('error', 'No se proporcionó el nombre del usario');
        return;
      }
      const songName = await this.playlistsService.getSongName(payload.songId);
      if (!songName) {
        client.emit('error', 'No se encontró la canción solicitada');
        return;
      }
      const formattedSongName = songName.replace(/ /g, '_');

      console.log('Solicitando stream de Azure para:', formattedSongName);
      const containerName = 'cancionespsoft';
      const nodeStream = await this.azureBlobService.getStream(containerName, `${formattedSongName}.mp3`);

      if (!nodeStream) {
        console.log('No se pudo obtener el stream de Azure');
        client.emit('error', 'No se pudo obtener el stream');
        return;
      }
      console.log('Stream de Azure obtenido correctamente');

      let chunkCount = 0;
      nodeStream.on('data', (chunk: Buffer) => {
        chunkCount++;
        if (chunkCount % 10 === 0) {
          console.log(`Enviando chunk #${chunkCount}, tamaño: ${chunk.length} bytes`);
        }
        client.emit('audioChunk', { data: chunk.toString('base64'), filename: songName });
      });

      nodeStream.on('end', () => {
        console.log(`Stream completado. Total enviado: ${chunkCount} chunks`);
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
    this.playlistsService.incrementSongAlbumAndAuthorPlays(payload.songId);
    console.log(`se guarda la ulitma cancion`);
    this.estadoUsuarioService.storeLastSong(payload.userId, payload.songId);
  }



  /**
 * Maneja el evento 'progressUpdate' para actualizar el tiempo actual de la canción que el usuario está escuchando.
 * @param client Cliente que envía el progreso
 * @param payload Objeto con userId, songId y currentTime en segundos
 */
  @SubscribeMessage('progressUpdate')
  async handleProgressUpdate(
    client: Socket,
    payload: { userId: string; songId: number; currentTime: number }
  ) {
    try {
      await this.estadoUsuarioService.updateSongTime(payload.userId, payload.songId, payload.currentTime);


      client.emit('progressSaved', { status: 'ok' });
    } catch (error) {
      client.emit('error', 'No se pudo actualizar el progreso');
    }
  }

  /**
   * Maneja la desconexión de un cliente.
   * @param client Cliente desconectado
   */
  handleDisconnect(client: Socket) {
    console.log('Cliente desconectado:', client.id);
  }

}
