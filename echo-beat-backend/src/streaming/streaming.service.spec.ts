import { Test, TestingModule } from '@nestjs/testing';
import { StreamingService } from './streaming.service';

describe('StreamingService', () => {
  let service: StreamingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StreamingService],
    }).compile();

    service = module.get<StreamingService>(StreamingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
