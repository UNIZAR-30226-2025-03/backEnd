import { Injectable } from '@nestjs/common';

@Injectable()
export class PlaylistsService {
  async getFirstSongInPlaylist(playlistId: string): Promise<string | null> {
    // Mock: Siempre devuelve el mismo nombre de archivo
    return 'mock_song_1.mp3';
  }

  async getNextSongInPlaylist(playlistId: string): Promise<string | null> {
    // Mock: Devuelve otro nombre de archivo
    return 'mock_song_2.mp3';
  }
}

