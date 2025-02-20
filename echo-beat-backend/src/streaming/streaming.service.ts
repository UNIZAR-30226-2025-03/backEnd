import { Injectable } from '@nestjs/common';
import { Readable } from 'stream';

@Injectable()
export class StreamingService {
  async getStream(containerName: string, filename: string): Promise<Readable> {
    // Mock: Crea un simple readable stream con contenido de ejemplo
    const stream = new Readable();
    stream.push(`Contenido mock de ${filename}`);
    stream.push(null); // Indica fin del stream
    return stream;
  }
}
