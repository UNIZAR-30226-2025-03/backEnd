import { Module } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { GeminiController } from './gemini.controller';
import { AdminService } from 'src/admin/admin.service';
import { PrismaService } from 'src/prisma/prisma.service'; 
@Module({
  controllers: [GeminiController],
  providers: [GeminiService,AdminService,PrismaService],
  exports: [GeminiService],
})
export class GeminiModule {}
