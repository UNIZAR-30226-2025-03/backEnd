import { Test, TestingModule } from '@nestjs/testing';
import { CancionService } from './cancion.service';

describe('CancionService', () => {
  let service: CancionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CancionService],
    }).compile();

    service = module.get<CancionService>(CancionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
