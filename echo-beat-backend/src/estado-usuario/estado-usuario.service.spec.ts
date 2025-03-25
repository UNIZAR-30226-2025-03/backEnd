import { Test, TestingModule } from '@nestjs/testing';
import { EstadoUsuarioService } from './estado-usuario.service';

describe('EstadoUsuarioService', () => {
  let service: EstadoUsuarioService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EstadoUsuarioService],
    }).compile();

    service = module.get<EstadoUsuarioService>(EstadoUsuarioService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
