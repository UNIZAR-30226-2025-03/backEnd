import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
//import { JWT_SECRET} from 'src/configs/jwt-secret'
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from 'src/prisma/prisma.service'; // un servicio global para inyectar Prisma
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [UsersModule,JwtModule.register({
    global: true,
    //secret: JWT_SECRET,

  })],
  controllers: [AuthController],
  providers: [AuthService, PrismaService],
  exports: [AuthService], // si quieres usarlo en otros módulos
})
export class AuthModule {}
