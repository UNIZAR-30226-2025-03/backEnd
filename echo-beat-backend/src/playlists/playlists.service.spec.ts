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
      findUnique: jest.fn(),
    },
    listaReproduccion: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlaylistsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
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
        NumLikes: 0,
      };

      const mockListaReproduccion = {
        Id: 1,
        Nombre: 'Test Playlist',
        EmailAutor: 'test@test.com',
        EsPrivada: 'false',
      };

      mockPrismaService.lista.create.mockResolvedValue(mockLista);
      mockPrismaService.listaReproduccion.create.mockResolvedValue(mockListaReproduccion);

      const result = await service.createPlaylist({
        name: 'Test Playlist',
        userId: 'test@test.com',
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
        Nombre: 'Test Playlist',
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
    it('should return empty message when user has no playlists', async () => {
      // Caso 1: El usuario no tiene playlists
      mockPrismaService.listaReproduccion.findMany.mockResolvedValue([]);
  
      const result = await service.findAllByUser('test@test.com');
      expect(result).toEqual({ message: 'El usuario no tiene playlists', playlists: [] });
    });
  
    it('should return all playlists for a user after creating them', async () => {
      const mockPlaylists = [
        {
          Id: 1,
          Nombre: 'Playlist 1',
          EmailAutor: 'test@test.com',
          lista: {
            Id: 1,
            Nombre: 'Playlist 1',
            Descripcion: 'Test description',
          },
        },
        {
          Id: 2,
          Nombre: 'Playlist 2',
          EmailAutor: 'test@test.com',
          lista: {
            Id: 2,
            Nombre: 'Playlist 2',
            Descripcion: 'Another description',
          },
        },
        // Playlist de otro usuario (no debe ser incluida en el resultado)
        {
          Id: 3,
          Nombre: 'Playlist 3',
          EmailAutor: 'anotheruser@test.com',
          lista: {
            Id: 3,
            Nombre: 'Playlist 3',
            Descripcion: 'Not included playlist',
          },
        },
        // Otra playlist de un usuario diferente
        {
          Id: 4,
          Nombre: 'Playlist 4',
          EmailAutor: 'anotheruser@test.com',
          lista: {
            Id: 4,
            Nombre: 'Playlist 4',
            Descripcion: 'Another not included playlist',
          },
        },
      ];
  
      // Simulamos que `findMany` filtre las playlists por `EmailAutor`
      mockPrismaService.listaReproduccion.findMany.mockImplementation(async (args) => {
        // Filtrar las playlists basándonos en el `EmailAutor`
        return mockPlaylists.filter(playlist => playlist.EmailAutor === args.where.EmailAutor);
      });
  
      // Llamamos a `findAllByUser` para obtener las playlists del usuario 'test@test.com'
      const result = await service.findAllByUser('test@test.com');
  
      // Console log para mostrar las playlists devueltas
      console.log('Playlists devueltas:', result);
  
      // Verificamos que solo las playlists del usuario 'test@test.com' sean devueltas
      const expectedResult = [
        {
          Id: 1,
          Nombre: 'Playlist 1',
          EmailAutor: 'test@test.com',
          lista: {
            Id: 1,
            Nombre: 'Playlist 1',
            Descripcion: 'Test description',
          },
        },
        {
          Id: 2,
          Nombre: 'Playlist 2',
          EmailAutor: 'test@test.com',
          lista: {
            Id: 2,
            Nombre: 'Playlist 2',
            Descripcion: 'Another description',
          },
        },
      ];
  
      // Asegúrate de que las playlists devueltas son las que corresponden al usuario 'test@test.com'
      expect(result).toEqual(expectedResult);
    });
  });
  
  
});
