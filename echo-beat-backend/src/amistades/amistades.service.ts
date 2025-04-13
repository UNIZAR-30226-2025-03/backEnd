import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AmistadesService {
  constructor(private prisma: PrismaService) { }

  /**
 * Envía una solicitud de amistad entre dos usuarios. Si ya existe una solicitud inversa, la acepta automáticamente.
 *
 * @param nickSender - Nick del usuario que envía la solicitud.
 * @param nickReceiver - Nick del usuario que la recibe.
 * @returns Mensaje indicando el resultado de la solicitud.
 */
  async solicitarAmistad(nickSender: string, nickReceiver: string): Promise<any> {
    if (!nickSender || !nickReceiver) {
      throw new BadRequestException("Ambos nicks son requeridos");
    }

    if (nickSender === nickReceiver) {
      throw new BadRequestException("No puedes enviarte una solicitud a ti mismo.");
    }

    const usuarioSender = await this.prisma.usuario.findUnique({ where: { Nick: nickSender } });
    const usuarioReceiver = await this.prisma.usuario.findUnique({ where: { Nick: nickReceiver } });

    if (!usuarioSender || !usuarioReceiver) {
      throw new NotFoundException("El nick introducido no existe.");
    }

    const amistadExistente = await this.prisma.amistad.findFirst({
      where: {
        OR: [
          { NickFriendSender: nickSender, NickFriendReceiver: nickReceiver },
          { NickFriendSender: nickReceiver, NickFriendReceiver: nickSender },
        ],
      },
    });

    if (amistadExistente) {
      if (amistadExistente.EstadoSolicitud === "aceptada") {
        throw new BadRequestException("Ya sois amigos.");
      }

      if (
        amistadExistente.NickFriendSender === nickReceiver &&
        amistadExistente.NickFriendReceiver === nickSender &&
        amistadExistente.EstadoSolicitud === "pendiente"
      ) {
        await this.prisma.amistad.update({
          where: {
            NickFriendSender_NickFriendReceiver: {
              NickFriendSender: nickReceiver,
              NickFriendReceiver: nickSender,
            },
          },
          data: {
            EstadoSolicitud: "aceptada",
            FechaComienzoAmistad: new Date(),
          },
        });
        return { message: "Solicitud mutua detectada. Amistad aceptada automáticamente." };
      } else {
        throw new BadRequestException("Ya existe una solicitud de amistad pendiente.");
      }
    }

    await this.prisma.amistad.create({
      data: {
        NickFriendSender: nickSender,
        NickFriendReceiver: nickReceiver,
        EstadoSolicitud: "pendiente",
      },
    });

    return { message: "Solicitud enviada correctamente." };
  }

  /**
 * Acepta una solicitud de amistad entre dos usuarios si ya existe.
 *
 * @param nickSender - Nick del remitente original de la solicitud.
 * @param nickReceiver - Nick del destinatario original de la solicitud.
 * @returns Información de la amistad aceptada.
 */
  async aceptarAmistad(nickSender: string, nickReceiver: string) {

    const existingFriendship = await this.prisma.amistad.findFirst({
      where: {
        OR: [
          { NickFriendSender: nickSender, NickFriendReceiver: nickReceiver },
          { NickFriendSender: nickReceiver, NickFriendReceiver: nickSender }
        ]
      }
    });

    if (!existingFriendship) {
      throw new NotFoundException('No existe una solicitud de amistad entre estos usuarios');
    }

    return this.prisma.amistad.update({
      where: {
        NickFriendSender_NickFriendReceiver: {
          NickFriendSender: existingFriendship.NickFriendSender,
          NickFriendReceiver: existingFriendship.NickFriendReceiver
        }
      },
      data: {
        EstadoSolicitud: 'aceptada',
        FechaComienzoAmistad: new Date()
      }
    });
  }

  /**
 * Rechaza una solicitud de amistad pendiente entre dos usuarios.
 *
 * @param nickSender - Nick del remitente de la solicitud.
 * @param nickReceiver - Nick del destinatario.
 * @returns Mensaje indicando que la solicitud fue eliminada.
 */
  async rechazarAmistad(nickSender: string, nickReceiver: string) {
    try {
      const solicitud = await this.prisma.amistad.findFirst({
        where: {
          NickFriendSender: nickSender,
          NickFriendReceiver: nickReceiver,
          EstadoSolicitud: 'pendiente',
        },
      });

      if (!solicitud) {
        throw new Error('No se encontró la solicitud de amistad pendiente.');
      }

      await this.prisma.amistad.delete({
        where: {
          NickFriendSender_NickFriendReceiver: {
            NickFriendSender: nickSender,
            NickFriendReceiver: nickReceiver,
          },
        },
      });

      return { mensaje: 'Solicitud eliminada correctamente.' };
    } catch (error) {
      console.error('❌ Error al eliminar solicitud:', error.message);
      throw new Error('No se pudo eliminar la solicitud de amistad.');
    }
  }

  /**
 * Elimina una amistad entre dos usuarios, si esta existe.
 *
 * @param nickSender - Uno de los usuarios.
 * @param nickReceiver - El otro usuario.
 * @returns Mensaje indicando que la amistad fue eliminada.
 */
  async eliminarAmistad(nickSender: string, nickReceiver: string) {

    const existingFriendship = await this.prisma.amistad.findFirst({
      where: {
        OR: [
          { NickFriendSender: nickSender, NickFriendReceiver: nickReceiver },
          { NickFriendSender: nickReceiver, NickFriendReceiver: nickSender }
        ]
      }
    });

    if (!existingFriendship) {
      throw new NotFoundException('No existe una amistad entre estos usuarios');
    }

    await this.prisma.amistad.delete({
      where: {
        NickFriendSender_NickFriendReceiver: {
          NickFriendSender: existingFriendship.NickFriendSender,
          NickFriendReceiver: existingFriendship.NickFriendReceiver
        }
      }
    });

    return { message: `Usuario ${nickReceiver} eliminado con éxito de tu lista de amigos.` };
  }

  /**
 * Obtiene todas las solicitudes de amistad pendientes dirigidas a un usuario.
 *
 * @param nickReceiver - Nick del usuario que recibe las solicitudes.
 * @returns Lista de usuarios que enviaron solicitudes y sus fotos.
 */
  async obtenerSolicitudesAmistad(nickReceiver: string) {
    try {
      const solicitudes = await this.prisma.amistad.findMany({
        where: {
          NickFriendReceiver: nickReceiver,
          EstadoSolicitud: 'pendiente',
        },
        select: {
          NickFriendSender: true,
          sender: {
            select: {
              LinkFoto: true,
            },
          },
        },
      });

      return solicitudes.map((solicitud) => ({
        NickFriendSender: solicitud.NickFriendSender,
        LinkFoto: solicitud.sender?.LinkFoto || null,
      }));
    } catch (error) {
      console.error('❌ Error al obtener solicitudes:', error.message);
      throw new Error('No se pudieron obtener las solicitudes de amistad.');
    }
  }

  /**
 * Obtiene la lista de amigos de un usuario, incluyendo su email, nick, foto y la canción actual (si tiene).
 *
 * @param nick - Nick del usuario.
 * @returns Lista de amigos con información adicional.
 */
  async obtenerAmigos(nick: string) {
    const amistades = await this.prisma.amistad.findMany({
      where: {
        OR: [
          { NickFriendSender: nick, EstadoSolicitud: 'aceptada' },
          { NickFriendReceiver: nick, EstadoSolicitud: 'aceptada' }
        ]
      },
      select: {
        NickFriendSender: true,
        NickFriendReceiver: true
      }
    });

    const listaAmigos = amistades.map((amistad) =>
      amistad.NickFriendSender === nick ? amistad.NickFriendReceiver : amistad.NickFriendSender
    );

    const amigos = await this.prisma.usuario.findMany({
      where: { Nick: { in: listaAmigos } },
      select: {
        Email: true,
        Nick: true,
        LinkFoto: true,
        ColaReproduccion: true
      }
    });

    return amigos.map((amigo) => {
      let nombreCancionActual: string | null = null;

      if (
        amigo.ColaReproduccion &&
        typeof amigo.ColaReproduccion === 'object' &&
        'canciones' in amigo.ColaReproduccion &&
        Array.isArray((amigo.ColaReproduccion as any).canciones) &&
        (amigo.ColaReproduccion as any).canciones.length > 0
      ) {
        nombreCancionActual = (amigo.ColaReproduccion as any).canciones[0].nombre;
      }

      return {
        Email: amigo.Email,
        Nick: amigo.Nick,
        LinkFoto: amigo.LinkFoto,
        CancionActual: nombreCancionActual,
      };
    });
  }
}
