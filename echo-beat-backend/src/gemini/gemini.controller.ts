import { Controller, Post, Body } from '@nestjs/common';
import { GeminiService } from './gemini.service';

@Controller('gemini')
export class GeminiController {
  constructor(private readonly geminiService: GeminiService) {}

  @Post()
  async generateMessage(
    @Body() body: { message: string },
  ): Promise<any> {
    // Llama al servicio sin recibir un contexto desde el usuario.
    return this.geminiService.getChatResponse(body.message);
  }
}
