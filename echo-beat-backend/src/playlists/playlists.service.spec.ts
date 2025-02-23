import { Test, TestingModule } from '@nestjs/testing';
import { PlaylistsService } from './playlists.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('PlaylistsService', () => {
  let service: PlaylistsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    lista: {
      create: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn()
    },
    listaReproduccion: {
      create: jest.fn(),
      findMany: jest.fn()
    }
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlaylistsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService
        }
      ],
    }).compile();

    service = module.get<PlaylistsService>(PlaylistsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPlaylist', () => {
    it('should create a new playlist successfully', async () => {
      const mockLista = {
        Id: 1,
        Nombre: 'Test Playlist',
        Descripcion: 'Nueva playlist',
        Portada: '',
        NumCanciones: 0,
        Duracion: 0,
        NumLikes: 0
      };

      const mockListaReproduccion = {
        Id: 1,
        Nombre: 'Test Playlist',
        EmailAutor: 'test@test.com',
        EsPrivada: 'false'
      };

      mockPrismaService.lista.create.mockResolvedValue(mockLista);
      mockPrismaService.listaReproduccion.create.mockResolvedValue(mockListaReproduccion);

      const result = await service.createPlaylist({
        name: 'Test Playlist',
        userId: 'test@test.com'
      });

      expect(result).toHaveProperty('lista');
      expect(result).toHaveProperty('listaReproduccion');
      expect(result.lista).toEqual(mockLista);
      expect(result.listaReproduccion).toEqual(mockListaReproduccion);
    });
  });

  describe('deletePlaylist', () => {
    it('should delete an existing playlist', async () => {
      const mockLista = {
        Id: 1,
        Nombre: 'Test Playlist'
      };

      mockPrismaService.lista.findUnique.mockResolvedValue(mockLista);
      mockPrismaService.lista.delete.mockResolvedValue(mockLista);

      const result = await service.deletePlaylist('1');
      expect(result).toEqual({ message: 'Playlist eliminada correctamente' });
    });

    it('should throw NotFoundException when playlist does not exist', async () => {
      mockPrismaService.lista.findUnique.mockResolvedValue(null);

      await expect(service.deletePlaylist('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllByUser', () => {
    it('should return all playlists for a user', async () => {
      const mockPlaylists = [
        {
          Id: 1,
          Nombre: 'Playlist 1',
          EmailAutor: 'test@test.com',
          lista: {
            Id: 1,
            Nombre: 'Playlist 1',
            Descripcion: 'Test description'
          }
        }
      ];

      mockPrismaService.listaReproduccion.findMany.mockResolvedValue(mockPlaylists);

      const result = await service.findAllByUser('test@test.com');
      expect(result).toEqual(mockPlaylists);
    });

    it('should return empty message when user has no playlists', async () => {
      mockPrismaService.listaReproduccion.findMany.mockResolvedValue([]);

      const result = await service.findAllByUser('test@test.com');
      expect(result).toEqual({ message: 'El usuario no tiene playlists', playlists: [] });
    });
  });
});
