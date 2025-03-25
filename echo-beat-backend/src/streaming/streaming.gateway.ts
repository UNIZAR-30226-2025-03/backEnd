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
  @WebSocketServer()
  server: Server;

  private readonly CHUNK_SIZE = 64 * 1024; // 64KB

  constructor(
    private azureBlobService: AzureBlobService,
    private playlistsService: PlaylistsService,
    private estadoUsuarioService: EstadoUsuarioService
  ) {}




  handleConnection(client: Socket) {
    console.log('Cliente conectado:', client.id);
  }
  

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
      // Se formatea el nombre de la canción reemplazando espacios por guiones bajos
      const formattedSongName = songName.replace(/ /g, '_');

      // Se solicita el stream de Azure Blob usando el nombre de la canción
      console.log('Solicitando stream de Azure para:', formattedSongName);
      const containerName = 'cancionespsoft';
      const nodeStream = await this.azureBlobService.getStream(containerName, `${formattedSongName}.mp3`);

      if (!nodeStream) {
        console.log('No se pudo obtener el stream de Azure');
        client.emit('error', 'No se pudo obtener el stream');
        return;
      }
      console.log('Stream de Azure obtenido correctamente');

      // Se envía el stream al cliente en chunks
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



  // Evento que recibirá el "currentTime" del cliente
  @SubscribeMessage('progressUpdate')
  async handleProgressUpdate(
    client: Socket,
    payload: { userId: string; songId: number; currentTime: number }
  ) {
    try {
      // Guardamos (o actualizamos) en la BD el tiempo actual de la canción
      await this.estadoUsuarioService.updateSongTime(payload.userId, payload.songId, payload.currentTime);

      
      client.emit('progressSaved', { status: 'ok' });
    } catch (error) {
      client.emit('error', 'No se pudo actualizar el progreso');
    }
  }


  handleDisconnect(client: Socket) {
    console.log('Cliente desconectado:', client.id);
  }

}
