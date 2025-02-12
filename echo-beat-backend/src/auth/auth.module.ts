import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
//import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from 'src/prisma/prisma.service'; // un servicio global para inyectar Prisma
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [UsersModule,JwtModule.register({
    global: true,
    secret: 'e7b1b1d2790ef3424d8a14b5c7d14b4df423b59c53c8f4425d7bc64d4e7dfc21a8ed73c3447e239e3541c9d5c2b928e0',
    signOptions: {expiresIn: '1d'}

  })],
  controllers: [AuthController],
  providers: [AuthService, PrismaService],
  exports: [AuthService], // si quieres usarlo en otros módulos
})
export class AuthModule {}
