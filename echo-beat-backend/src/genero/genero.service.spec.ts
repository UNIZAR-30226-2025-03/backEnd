import { Test, TestingModule } from '@nestjs/testing';
import { GeneroService } from './genero.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('GeneroService', () => {
  let service: GeneroService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    preferencia: {
      findMany: jest.fn(),
    },
    genero: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeneroService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<GeneroService>(GeneroService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getGenerosByEmail', () => {
    it('should return the correct genres for the user and exclude others', async () => {
      // Simulamos que estos son los géneros de un usuario en la base de datos.
      const mockPlaylists = [
        {
          Id: 1,
          NombreGenero: 'Pop',
          Email: 'test@test.com',
        },
        {
          Id: 2,
          NombreGenero: 'Rock',
          Email: 'test@test.com',
        },
        {
          Id: 3,
          NombreGenero: 'Jazz',
          Email: 'test@test.com',
        },
        // Género de otro usuario que no debe ser incluido
        {
          Id: 4,
          NombreGenero: 'Classical',
          Email: 'anotheruser@test.com',
        },
      ];

      // Filtramos las playlists en el mock para que solo se devuelvan las que corresponden al email
      mockPrismaService.preferencia.findMany.mockImplementation(async (args) => {
        return mockPlaylists.filter(playlist => playlist.Email === args.where.Email);
      });

      // Llamamos a la función con el email del usuario 'test@test.com'
      const result = await service.getGenerosByEmail('test@test.com');

      // Las playlists devueltas deben ser solo las asociadas al usuario 'test@test.com'
      expect(result).toEqual(['Pop', 'Rock', 'Jazz']);
    });

    it('should return an empty array if no genres are found for the user', async () => {
      // Simulamos que no hay preferencias para el usuario
      mockPrismaService.preferencia.findMany.mockResolvedValue([]);

      const result = await service.getGenerosByEmail('test@test.com');

      // Si no hay géneros, debe devolver un arreglo vacío
      expect(result).toEqual([]);
    });
  });

  describe('getFotoGeneroByNombre', () => {
    it('should return the correct photo for the genre', async () => {
      const mockGenero = { NombreGenero: 'Pop', FotoGenero: 'url_to_pop_image.jpg' };

      // Simulamos que Prisma devuelve el género con la foto correcta
      mockPrismaService.genero.findUnique.mockResolvedValue(mockGenero);

      // Llamamos a la función con el nombre del género 'Pop'
      const result = await service.getFotoGeneroByNombre('Pop');
      
      // Verificamos que la foto sea la correcta
      expect(result).toEqual('url_to_pop_image.jpg');
    });

    it('should throw an error if genre is not found', async () => {
      // Simulamos que no se encuentra el género
      mockPrismaService.genero.findUnique.mockResolvedValue(null);

      // Llamamos a la función con un nombre de género inexistente
      await expect(service.getFotoGeneroByNombre('NonExistentGenre')).rejects.toThrow('Género no encontrado');
    });
  });
});
