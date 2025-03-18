import { Test, TestingModule } from '@nestjs/testing';
import { ColaReproduccionController } from './cola-reproduccion.controller';

describe('ColaReproduccionController', () => {
  let controller: ColaReproduccionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ColaReproduccionController],
    }).compile();

    controller = module.get<ColaReproduccionController>(ColaReproduccionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
