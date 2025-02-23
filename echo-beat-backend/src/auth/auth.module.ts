import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
//import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from 'src/prisma/prisma.service'; // un servicio global para inyectar Prisma
import { UsersService } from '../users/users.service';
import { ConfigModule, ConfigService } from '@nestjs/config';


@Module({
  imports: [UsersModule,JwtModule.registerAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => ({
      secret: configService.get<string>('JWT_SECRET'), // Lee la variable de entorno JWT_SECRET
      signOptions: { expiresIn: '1d' }, // Configuración del token
    }),
  }),],
  controllers: [AuthController],
  providers: [AuthService, PrismaService],
  exports: [AuthService], // si quieres usarlo en otros módulos
})
export class AuthModule {}
