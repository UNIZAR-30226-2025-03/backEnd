import { Test, TestingModule } from '@nestjs/testing';
import { ColaReproduccionService } from './cola-reproduccion.service';

describe('ColaReproduccionService', () => {
  let service: ColaReproduccionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ColaReproduccionService],
    }).compile();

    service = module.get<ColaReproduccionService>(ColaReproduccionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
