import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { GeminiService } from './gemini.service';

export class GenerateMessageDto {
  /**
   * Mensaje que el usuario envía para obtener una respuesta
   */
  message: string;
}

@Controller('gemini')
@ApiTags('gemini')
export class GeminiController {
  constructor(private readonly geminiService: GeminiService) {}

  @Post()
  @ApiOperation({
    summary: 'Generar mensaje con Gemini',
    description: 'Genera una respuesta utilizando el mensaje enviado. El contexto se obtiene automáticamente llamando a exportAllData del módulo admin, de modo que el modelo sepa que solo debe responder preguntas relacionadas con los datos de la aplicación de música.',
  })
  @ApiBody({ type: GenerateMessageDto })
  @ApiResponse({
    status: 200,
    description: 'Respuesta generada exitosamente por la API Gemini.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request. El campo "message" es obligatorio o no se envió el JSON correctamente.',
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno al llamar a la API Gemini.',
  })
  async generateMessage(
    @Body() body: GenerateMessageDto,
  ): Promise<any> {
    // Llama al servicio Gemini sin pasar un contexto desde el usuario, ya que éste se obtiene internamente.
    return this.geminiService.getChatResponse(body.message);
  }
}
