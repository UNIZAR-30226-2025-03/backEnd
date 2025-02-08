import { Test, TestingModule } from '@nestjs/testing';
import { StreamingGateway } from './streaming.gateway';

describe('StreamingGateway', () => {
  let gateway: StreamingGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StreamingGateway],
    }).compile();

    gateway = module.get<StreamingGateway>(StreamingGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
