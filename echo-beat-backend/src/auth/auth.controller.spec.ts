import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
describe('AuthController', () => {
    let controller: AuthController;
    let app: INestApplication;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
        }).compile();

        app = module.createNestApplication();
        await app.init();

        controller = module.get<AuthController>(AuthController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('/GET auth', () => {
        return request(app.getHttpServer())
            .get('/auth')
            .expect(200)
            .expect('Hello World');
    });

    afterAll(async () => {
        await app.close();
  });
});
