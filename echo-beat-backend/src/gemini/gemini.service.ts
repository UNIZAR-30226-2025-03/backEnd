import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai'; // Asumiendo que usas esta librería u otra que facilite la llamada a Gemini.
import { AdminService } from 'src/admin/admin.service'; // Ajusta la ruta según tu proyecto

@Injectable()
export class GeminiService {
  private readonly ai: GoogleGenAI;

  constructor(private dataExportService: AdminService) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY no está definida en el entorno.');
    }
    // Inicializa el cliente con la API Key  
    this.ai = new GoogleGenAI({ apiKey });
  }

  /**
   * Obtiene la respuesta del modelo Gemini a partir del mensaje del usuario.
   * El contexto se obtiene llamando a exportAllData del módulo admin.
   * @param message Mensaje del usuario.
   * @returns Respuesta generada por Gemini.
   */
  async getChatResponse(message: string): Promise<any> {
    try {
      // Llama al servicio de exportación para obtener el contexto (los datos de la app)
      const dataExport = await this.dataExportService.exportAllData();
      // Convierte el JSON a una cadena de texto. Puedes elegir formatearlo si lo prefieres.
      const context = JSON.stringify(dataExport);
      // Construye un prompt que combine el contexto y el mensaje.
      // Por ejemplo:
      const prompt = `${context}\nUsuario: ${message}\nChatbot:`;
      
      // Llama al modelo Gemini con el prompt construido.
      // Ajusta el nombre del modelo y los parámetros según la documentación.
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.0-flash', // Verifica cuál es el modelo correcto.
        contents: prompt,
      });
      return response;
    } catch (error) {
      console.error('Error llamando a Gemini API:', error);
      throw new InternalServerErrorException('Error al llamar a la API Gemini');
    }
  }
}
