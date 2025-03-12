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




  handleConnection(client: Socket) {
    console.log('Cliente conectado:', client.id);
  }
  

  /**
   * Inicia la reproducción de la primera canción de la playlist.
   * Se obtiene el nombre de la primera canción usando 'getFirstSongInPlaylist'.
   */
  @SubscribeMessage('startStreamAlbum')
  async handleStartStreamAlbum(client: Socket, payload: { playlistId: string }) {
    console.log('Evento startStream recibido para playlist:', payload.playlistId);
    try {
      // 1. Obtiene la primera canción de la playlist
      const songName = await this.playlistsService.getFirstSongInPlaylist(payload.playlistId);
      console.log('Canción encontrada:', songName || 'No encontrada');
      if (!songName) {
        client.emit('error', 'No se encontró la primera canción en la playlist');
        return;
      }
  
      const formattedSongName = songName.replace(/ /g, '_');

      // 2. Pide el stream de Azure Blob usando el nombre de la canción
      console.log('Solicitando stream de Azure para:', formattedSongName);
      const containerName = 'cancionespsoft';
      const nodeStream = await this.azureBlobService.getStream(containerName, formattedSongName + '.mp3');
  
      if (!nodeStream) {
        console.log('No se pudo obtener el stream de Azure');
        client.emit('error', 'No se pudo obtener el stream');
        return;
      }
      console.log('Stream de Azure obtenido correctamente');
  
      // 3. Envía el stream al cliente en chunks
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
  }
  /**
   * Avanza a la siguiente canción de la playlist.
   * Se basa en 'getNextSongInPlaylist' para obtener la siguiente.
   */
  @SubscribeMessage('nextStream')
  async handleNextStreamAlbum(client: Socket, payload: { playlistId: string }) {
    console.log('Evento nextStream recibido para playlist:', payload.playlistId);
    try {
      // 1. Obtiene la siguiente canción de la playlist
      const songName = await this.playlistsService.getNextSongInPlaylist(payload.playlistId);
      console.log('Siguiente canción encontrada:', songName || 'No encontrada');
      if (!songName) {
        client.emit('error', 'No se encontró la siguiente canción en la playlist');
        return;
      }

      // Reemplazar espacios por guiones bajos para coincidir con el formato en Azure
      const formattedSongName = songName.replace(/ /g, '_');

      // 2. Pide el stream de Azure Blob usando el nombre de la canción formateado
      console.log('Solicitando stream de Azure para:', formattedSongName);
      const containerName = 'cancionespsoft';
      const nodeStream = await this.azureBlobService.getStream(containerName, formattedSongName + '.mp3');

      if (!nodeStream) {
        console.log('No se pudo obtener el stream de Azure');
        client.emit('error', 'No se pudo obtener el stream');
        return;
      }
      console.log('Stream de Azure obtenido correctamente');

      // 3. Envía el stream al cliente en chunks
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
      console.error('Error al procesar la siguiente canción:', error);
      client.emit('error', 'Error al transmitir la canción');
    }
  }

  @SubscribeMessage('startStream')
  async handleStartSong(client: Socket, payload: { songName: string }) {
    console.log('Evento startStream recibido para canción:', payload.songName);
    try {
      if (!payload.songName) {
        client.emit('error', 'No se proporcionó el nombre de la canción');
        return;
      }
      // Se formatea el nombre de la canción reemplazando espacios por guiones bajos
      const formattedSongName = payload.songName.replace(/ /g, '_');

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
        client.emit('audioChunk', { data: chunk.toString('base64'), filename: payload.songName });
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

  handleDisconnect(client: Socket) {
    console.log('Cliente desconectado:', client.id);
  }

}