import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUsersService = {
    getUserLastPlayedData: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        PrismaService, // Si PrismaService es necesario, pero no se usa directamente en las pruebas
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getUserLastPlayedData', () => {
    it('should return the correct last played data for the user', async () => {
      const mockData = {
        UltimaCancionEscuchada: 5,
        UltimaListaEscuchada: 10,
      };

      // Simulamos que el servicio devuelve los datos correctos para el email dado
      mockUsersService.getUserLastPlayedData.mockResolvedValue(mockData);

      const result = await controller.getUserLastPlayedData('test@test.com');

      // Agregamos los console.log para verificar los datos
      console.log('Resultado de la API:', result);

      expect(result).toEqual(mockData);
      expect(mockUsersService.getUserLastPlayedData).toHaveBeenCalledWith('test@test.com');
    });

    it('should throw an error if the user is not found', async () => {
      // Simulamos que el servicio no encuentra el usuario
      mockUsersService.getUserLastPlayedData.mockRejectedValue(new NotFoundException('Usuario no encontrado'));

      await expect(controller.getUserLastPlayedData('nonexistent@test.com')).rejects.toThrowError(
        'Usuario no encontrado',
      );
    });
  });
});
