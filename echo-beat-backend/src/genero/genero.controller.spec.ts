import { Test, TestingModule } from '@nestjs/testing';
import { GeneroController } from './genero.controller';

describe('GeneroController', () => {
  let controller: GeneroController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GeneroController],
    }).compile();

    controller = module.get<GeneroController>(GeneroController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
