import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AuthGuard } from './guards/auth.guard';

describe('AuthController', () => {
  let app: INestApplication;
  let authService: AuthService;

  const mockAuthService = {
    authenticate: jest.fn().mockImplementation(({ Email, Password }) => {
      if (Email === 'test@example.com' && Password === 'password123') {
        return { accessToken: 'mocked_jwt_token' };
      }
      throw new Error('Invalid credentials');
    }),
  };

  const mockAuthGuard = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    app = module.createNestApplication();
    await app.init();

    authService = module.get<AuthService>(AuthService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/login', () => {
    it('should return an access token for valid credentials', async () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ Email: 'test@example.com', Password: 'password123' })
        .expect(200)
        .expect({ accessToken: 'mocked_jwt_token' });
    });

    it('should return 401 for invalid credentials', async () => {
      mockAuthService.authenticate = jest.fn().mockImplementation(() => {
        throw new Error('Invalid credentials');
      });

      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ Email: 'wrong@example.com', Password: 'wrongpass' })
        .expect(401);
    });
  });

  describe('GET /auth/me', () => {
    it('should return user info if authenticated', async () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer mocked_jwt_token')
        .expect(200)
        .expect({ userId: 1, email: 'test@example.com' });
    });
  });
});
