import { Test, TestingModule } from '@nestjs/testing';
import { StreamingGateway } from './streaming.gateway';
import { AzureBlobService } from '../azure-blob/azure-blob.service';
import { PlaylistsService } from '../playlists/playlists.service';

describe('StreamingGateway', () => {
  let gateway: StreamingGateway;

  const mockAzureBlobService = { getStream: jest.fn() };
  const mockPlaylistsService = {
    getFirstSongInPlaylist: jest.fn(),
    getNextSongInPlaylist: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StreamingGateway,
        { provide: AzureBlobService, useValue: mockAzureBlobService },
        { provide: PlaylistsService, useValue: mockPlaylistsService }
      ]
    }).compile();

    gateway = module.get<StreamingGateway>(StreamingGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});