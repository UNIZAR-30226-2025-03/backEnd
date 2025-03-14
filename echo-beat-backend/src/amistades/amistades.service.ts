import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AmistadesService {
  constructor(private prisma: PrismaService) {}

  async solicitarAmistad(nickSender: string, nickReceiver: string) {
    const sender = await this.prisma.usuario.findUnique({ where: { Nick: nickSender } });
    const receiver = await this.prisma.usuario.findUnique({ where: { Nick: nickReceiver } });

    if (!sender || !receiver) {
        throw new NotFoundException('Uno o ambos usuarios no existen');
    }

    // Buscar si ya existe una solicitud en cualquier dirección
    const existingFriendship = await this.prisma.amistad.findFirst({
        where: {
        OR: [
            { NickFriendSender: nickSender, NickFriendReceiver: nickReceiver },
            { NickFriendSender: nickReceiver, NickFriendReceiver: nickSender }
        ]
        }
    });

    if (existingFriendship) {
        // Si ya existe una solicitud, actualizar el estado a "aceptada"
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

    // Si no existe, crear una nueva solicitud en estado "pendiente"
    return this.prisma.amistad.create({
        data: {
        NickFriendSender: nickSender,
        NickFriendReceiver: nickReceiver,
        EstadoSolicitud: 'pendiente'
        }
    });
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
    return this.prisma.amistad.delete({
      where: {
        NickFriendSender_NickFriendReceiver: {
          NickFriendSender: existingFriendship.NickFriendSender,
          NickFriendReceiver: existingFriendship.NickFriendReceiver
        }
      }
    });
  }

  async obtenerSolicitudesAmistad(nickReceiver: string) {
    return this.prisma.amistad.findMany({
      where: { NickFriendReceiver: nickReceiver, EstadoSolicitud: 'pendiente' },
      select: { NickFriendSender: true }
    });
  }

  async obtenerAmigos(nick: string) {
    // Buscar todas las amistades donde el usuario es el emisor o el receptor
    const amigos = await this.prisma.amistad.findMany({
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
    const listaAmigos = amigos.map((amistad) =>
      amistad.NickFriendSender === nick ? amistad.NickFriendReceiver : amistad.NickFriendSender
    );

    // Buscar los usuarios que coincidan con los nicks de la lista
    return this.prisma.usuario.findMany({
      where: { Nick: { in: listaAmigos } },
      select: {
        Nick: true,
        ColaReproduccion: true
      }
    });
  }
}
