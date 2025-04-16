import { Controller, Get, Post, Delete, Body, Param, BadRequestException } from '@nestjs/common';
import { AmistadesService } from './amistades.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';

@ApiTags('Amistades')
@Controller('amistades')
export class AmistadesController {
  constructor(private readonly amistadesService: AmistadesService) { }

  /**
 * Envía una solicitud de amistad entre dos usuarios.
 * 
 * @param nickSender - Nick del usuario que envía la solicitud.
 * @param nickReceiver - Nick del usuario que recibe la solicitud.
 * @returns Resultado de la operación o error si los datos son inválidos.
 */
  @ApiOperation({ summary: 'Enviar solicitud de amistad' })
  @ApiResponse({ status: 201, description: 'Solicitud enviada correctamente.' })
  @ApiResponse({ status: 400, description: 'No puedes enviarte una solicitud a ti mismo.' })
  @ApiBody({
    description: 'Nick del usuario que envía la solicitud y del que la recibe.',
    schema: {
      type: 'object',
      properties: {
        nickSender: { type: 'string', example: 'usuario1' },
        nickReceiver: { type: 'string', example: 'usuario2' }
      }
    }
  })
  @Post('solicitar')
  async solicitarAmistad( 
    @Body('nickSender') nickSender: string,
    @Body('nickReceiver') nickReceiver: string
  ) {
    if (nickSender === nickReceiver) {
      throw new BadRequestException('No puedes enviarte una solicitud a ti mismo');
    }
    return this.amistadesService.solicitarAmistad(nickSender, nickReceiver);
  }

  /**
   * Acepta una solicitud de amistad.
   * 
   * @param nickSender - Nick del usuario que envió la solicitud.
   * @param nickReceiver - Nick del usuario que la acepta.
   * @returns Resultado de la actualización de estado de amistad.
   */
  @ApiOperation({ summary: 'Aceptar solicitud de amistad' })
  @ApiResponse({ status: 200, description: 'Solicitud aceptada correctamente.' })
  @ApiBody({
    description: 'Nick del usuario que envió la solicitud y del que la acepta.',
    schema: {
      type: 'object',
      properties: {
        nickSender: { type: 'string', example: 'usuario1' },
        nickReceiver: { type: 'string', example: 'usuario2' }
      }
    }
  })
  @Post('aceptar')
  async aceptarAmistad(
    @Body('nickSender') nickSender: string,
    @Body('nickReceiver') nickReceiver: string
  ) {
    return this.amistadesService.aceptarAmistad(nickSender, nickReceiver);
  }

  /**
   * Rechaza una solicitud de amistad.
   * 
   * @param nickSender - Nick del usuario que envió la solicitud.
   * @param nickReceiver - Nick del usuario que la rechaza.
   * @returns Confirmación de eliminación de la solicitud.
   */
  @ApiOperation({ summary: 'Rechazar solicitud de amistad' })
  @ApiResponse({ status: 200, description: 'Solicitud rechazada correctamente.' })
  @ApiBody({
    description: 'Nick del usuario que envió la solicitud y del que la acepta.',
    schema: {
      type: 'object',
      properties: {
        nickSender: { type: 'string', example: 'usuario1' },
        nickReceiver: { type: 'string', example: 'usuario2' }
      }
    }
  })
  @Post('rechazar')
  async rechazarAmistad(
    @Body('nickSender') nickSender: string,
    @Body('nickReceiver') nickReceiver: string
  ) {
    return this.amistadesService.rechazarAmistad(nickSender, nickReceiver);
  }

  /**
   * Elimina una amistad existente entre dos usuarios.
   * 
   * @param nickSender - Nick del primer usuario.
   * @param nickReceiver - Nick del segundo usuario.
   * @returns Mensaje de éxito o error si no existe la amistad.
   */
  @ApiOperation({ summary: 'Eliminar amistad' })
  @ApiResponse({ status: 200, description: 'Amistad eliminada correctamente.' })
  @ApiResponse({ status: 404, description: 'No existe una amistad entre estos usuarios.' })
  @ApiParam({ name: 'nickSender', required: true, example: 'usuario1' })
  @ApiParam({ name: 'nickReceiver', required: true, example: 'usuario2' })
  @Delete('eliminar/:nickSender/:nickReceiver')
  async eliminarAmistad(
    @Param('nickSender') nickSender: string,
    @Param('nickReceiver') nickReceiver: string
  ) {
    return this.amistadesService.eliminarAmistad(nickSender, nickReceiver);
  }

  /**
   * Obtiene las solicitudes de amistad pendientes recibidas por un usuario.
   * 
   * @param nick - Nick del usuario que recibe las solicitudes.
   * @returns Lista de solicitudes pendientes con foto del remitente.
   */
  @ApiOperation({ summary: 'Ver solicitudes de amistad recibidas' })
  @ApiResponse({ status: 200, description: 'Lista de solicitudes de amistad pendientes.' })
  @ApiParam({ name: 'nickReceiver', required: true, example: 'usuario2' })
  @Get('verSolicitudes/:nickReceiver')
  async obtenerSolicitudesAmistad(@Param('nickReceiver') nick: string) {
    return this.amistadesService.obtenerSolicitudesAmistad(nick);
  }

  /**
   * Obtiene la lista de amigos de un usuario, incluyendo su canción actual (si existe).
   * 
   * @param nick - Nick del usuario.
   * @returns Lista de amigos y su información.
   */
  @ApiOperation({ summary: 'Ver amigos de un usuario y su última canción escuchada' })
  @ApiResponse({ status: 200, description: 'Lista de amigos y sus últimas canciones escuchadas.' })
  @ApiParam({ name: 'nick', required: true, example: 'usuario1' })
  @Get('verAmigos/:nick')
  async obtenerAmigos(@Param('nick') nick: string) {
    return this.amistadesService.obtenerAmigos(nick);
  }
}
