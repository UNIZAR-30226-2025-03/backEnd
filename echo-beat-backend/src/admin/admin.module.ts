import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AuthModule } from 'src/auth/auth.module'; // Ajusta la ruta según la estructura de tu proyecto
import { AdminAuthGuard } from './admin-auth.guard'; // Asegúrate de que la ruta sea correcta

@Module({
  imports: [AuthModule], // Aquí se importa el módulo que provee JwtModule (y JwtService)
  controllers: [AdminController],
  providers: [AdminService, PrismaService, AdminAuthGuard],
})
export class AdminModule {}
