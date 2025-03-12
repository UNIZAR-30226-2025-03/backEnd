import { Test, TestingModule } from '@nestjs/testing';
import { AmistadesController } from './amistades.controller';

describe('AmistadesController', () => {
  let controller: AmistadesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AmistadesController],
    }).compile();

    controller = module.get<AmistadesController>(AmistadesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
