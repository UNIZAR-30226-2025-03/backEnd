import { Test, TestingModule } from '@nestjs/testing';
import { AmistadesService } from './amistades.service';

describe('AmistadesService', () => {
  let service: AmistadesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AmistadesService],
    }).compile();

    service = module.get<AmistadesService>(AmistadesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
