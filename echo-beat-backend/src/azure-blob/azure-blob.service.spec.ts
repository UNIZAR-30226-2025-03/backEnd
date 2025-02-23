import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AzureBlobService } from './azure-blob.service';
import 'dotenv/config';

describe('AzureBlobService', () => {
  let service: AzureBlobService;

  const mockConfigService = {
    get: jest.fn().mockReturnValue('fake-connection-string')
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AzureBlobService,
        {
          provide: ConfigService,
          useValue: mockConfigService
        }
      ]
    }).compile();

    service = module.get<AzureBlobService>(AzureBlobService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});