import { Test, TestingModule } from '@nestjs/testing';
import { PlaylistsController } from './playlists.controller';
import { PlaylistsService } from './playlists.service';
import { NotFoundException } from '@nestjs/common';

describe('PlaylistsController', () => {
  let controller: PlaylistsController;
  let service: PlaylistsService;

  const mockPlaylistsService = {
    createPlaylist: jest.fn(),
    deletePlaylist: jest.fn(),
    findAllByUser: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlaylistsController],
      providers: [
        {
          provide: PlaylistsService,
          useValue: mockPlaylistsService
        }
      ]
    }).compile();

    controller = module.get<PlaylistsController>(PlaylistsController);
    service = module.get<PlaylistsService>(PlaylistsService);
  });

  describe('createPlaylist', () => {
    it('should create a new playlist', async () => {
      const createDto = {
        name: 'Test Playlist',
        userId: 'test@user.com'
      };

      const expectedResponse = {
        lista: {
          Id: 1,
          Nombre: 'Test Playlist',
          Descripcion: 'Nueva playlist'
        },
        listaReproduccion: {
          Id: 1,
          Nombre: 'Test Playlist',
          EmailAutor: 'test@user.com'
        }
      };

      mockPlaylistsService.createPlaylist.mockResolvedValue(expectedResponse);

      const result = await controller.createPlaylist(createDto);
      expect(result).toEqual(expectedResponse);
      expect(mockPlaylistsService.createPlaylist).toHaveBeenCalledWith(createDto);
    });
  });

  describe('deletePlaylist', () => {
    it('should delete an existing playlist', async () => {
      const playlistId = '1';
      mockPlaylistsService.deletePlaylist.mockResolvedValue({ message: 'Playlist eliminada correctamente' });

      const result = await controller.deletePlaylist(playlistId);
      expect(result).toEqual({ message: 'Playlist eliminada correctamente.' });
      expect(mockPlaylistsService.deletePlaylist).toHaveBeenCalledWith(playlistId);
    });

    it('should throw NotFoundException when playlist does not exist', async () => {
      const playlistId = '999';
      mockPlaylistsService.deletePlaylist.mockRejectedValue(new NotFoundException());

      await expect(controller.deletePlaylist(playlistId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPlaylistsByUser', () => {
    it('should return all playlists for a user', async () => {
      const userId = 'test@user.com';
      const expectedPlaylists = [
        {
          Id: 1,
          Nombre: 'Playlist 1',
          EmailAutor: 'test@user.com'
        },
        {
          Id: 2,
          Nombre: 'Playlist 2',
          EmailAutor: 'test@user.com'
        }
      ];

      mockPlaylistsService.findAllByUser.mockResolvedValue(expectedPlaylists);

      const result = await controller.getPlaylistsByUser(userId);
      expect(result).toEqual(expectedPlaylists);
      expect(mockPlaylistsService.findAllByUser).toHaveBeenCalledWith(userId);
    });

    it('should return empty array when user has no playlists', async () => {
      const userId = 'test@user.com';
      mockPlaylistsService.findAllByUser.mockResolvedValue([]);

      const result = await controller.getPlaylistsByUser(userId);
      expect(result).toEqual([]);
    });
  });
});