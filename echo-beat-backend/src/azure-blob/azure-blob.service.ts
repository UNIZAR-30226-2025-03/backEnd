import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BlobServiceClient } from '@azure/storage-blob';

@Injectable()
export class AzureBlobService {
  private blobServiceClient: BlobServiceClient;

  /**
 * Inicializa el servicio AzureBlobService con la cadena de conexión proporcionada por ConfigService.
 *
 * @param configService - Servicio de configuración de NestJS para acceder a variables de entorno.
 */
  constructor(private configService: ConfigService) {
    const connectionString = this.configService.get<string>('AZURE_STORAGE_CONNECTION_STRING');
    if (!connectionString) {
      throw new Error('Azure Storage connection string is not defined');
    }
    this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  }

  /**
 * Obtiene un stream legible (`ReadableStream`) desde un blob de Azure Storage.
 *
 * @param containerName - Nombre del contenedor en Azure Blob Storage.
 * @param blobName - Nombre del blob (archivo) a descargar.
 * @returns Un stream legible del blob solicitado.
 */
  async getStream(containerName: string, blobName: string) {
    const containerClient = this.blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlobClient(blobName);
    const response = await blobClient.download();
    return response.readableStreamBody;
  }
}