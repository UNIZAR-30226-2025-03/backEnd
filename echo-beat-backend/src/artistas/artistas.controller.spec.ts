import { Test, TestingModule } from '@nestjs/testing';
import { ArtistasController } from './artistas.controller';

describe('ArtistasController', () => {
  let controller: ArtistasController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ArtistasController],
    }).compile();

    controller = module.get<ArtistasController>(ArtistasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
