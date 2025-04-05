import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AmistadesService {
  constructor(private prisma: PrismaService) {}

  async solicitarAmistad(nickSender: string, nickReceiver: string): Promise<any> {
    if (!nickSender || !nickReceiver) {
      throw new BadRequestException("Ambos nicks son requeridos");
    }
  
    if (nickSender === nickReceiver) {
      throw new BadRequestException("No puedes enviarte una solicitud a ti mismo.");
    }
  
    // Verifica que ambos usuarios existan
    const usuarioSender = await this.prisma.usuario.findUnique({ where: { Nick: nickSender } });
    const usuarioReceiver = await this.prisma.usuario.findUnique({ where: { Nick: nickReceiver } });
  
    if (!usuarioSender || !usuarioReceiver) {
      throw new NotFoundException("El nick introducido no existe.");
    }
  
    // Verifica si ya existe una amistad en cualquier dirección
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
  
      // Si ya existe una solicitud en la dirección opuesta, acéptala automáticamente
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
  
    // Crear nueva solicitud de amistad
    await this.prisma.amistad.create({
      data: {
        NickFriendSender: nickSender,
        NickFriendReceiver: nickReceiver,
        EstadoSolicitud: "pendiente",
      },
    });
  
    return { message: "Solicitud enviada correctamente." };
  }

  async aceptarAmistad(nickSender: string, nickReceiver: string) {

    // Buscar si ya existe una solicitud en cualquier dirección
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

    // Actualizar el estado de la solicitud a "aceptada"
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

  async rechazarAmistad(nickSender: string, nickReceiver: string) {
    try {
      const solicitud = await this.prisma.amistad.findFirst({
        where: {
          NickFriendSender: nickSender,
          NickFriendReceiver: nickReceiver,
          EstadoSolicitud: 'pendiente', // o el estado que uses para indicar solicitud no aceptada
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

  async eliminarAmistad(nickSender: string, nickReceiver: string) {

    // Buscar si ya existe una amistad en cualquier dirección
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

    // Eliminar la amistad
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

  async obtenerAmigos(nick: string) {
    // Buscar todas las amistades donde el usuario es el emisor o el receptor
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

    // Crear una lista con los nicks de los amigos
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
