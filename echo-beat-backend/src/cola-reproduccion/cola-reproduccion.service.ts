import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ColaReproduccionService {
    constructor(private prisma: PrismaService) { }

    async iniciarColaReproduccion(userEmail: string, reproduccionAleatoria: boolean, colaReproduccion: any) {
        // 🔹 1️⃣ Comprobar que el usuario exista
        const user = await this.prisma.usuario.findUnique({
            where: { Email: userEmail },
            select: { Email: true },
        });

        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

        // 🔹 2️⃣ Validar el formato del JSON
        if (!colaReproduccion || typeof colaReproduccion !== 'object' || !Array.isArray(colaReproduccion.canciones)) {
            throw new BadRequestException('El formato de la cola de reproducción no es válido.');
        }

        const canciones = colaReproduccion.canciones;

        for (const cancion of canciones) {
            if (
                typeof cancion.id !== 'number' ||
                typeof cancion.nombre !== 'string' ||
                typeof cancion.duracion !== 'number' ||
                typeof cancion.numReproducciones !== 'number' ||
                typeof cancion.numFavoritos !== 'number' ||
                typeof cancion.portada !== 'string'
            ) {
                throw new BadRequestException('Una o más canciones tienen un formato inválido.');
            }
        }

        // 🔹 3️⃣ Si reproducción aleatoria está activa, barajar las canciones
        if (reproduccionAleatoria) {
            for (let i = canciones.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [canciones[i], canciones[j]] = [canciones[j], canciones[i]];
            }
        }

        // 🔹 4️⃣ Guardar la nueva cola en la BD y poner PosicionCola a 0
        await this.prisma.usuario.update({
            where: { Email: userEmail },
            data: {
                ColaReproduccion: { canciones }, // Guardamos el JSON reordenado o como estaba
                PosicionCola: 0,
            },
        });

        const primeraCancion = canciones[0];

        return {
            message: 'Cola de reproducción actualizada correctamente',
            primeraCancionId: primeraCancion.id,
        };
    }

    async iniciarColaReproduccionPorPosicion(userEmail: string, reproduccionAleatoria: boolean, colaReproduccion: any, posicionCola: number) {
        const user = await this.prisma.usuario.findUnique({
            where: { Email: userEmail },
        });

        if (!user) {
            throw new NotFoundException('Usuario no encontrado.');
        }

        if (!colaReproduccion || !Array.isArray(colaReproduccion.canciones)) {
            throw new BadRequestException('El JSON debe contener un array llamado "canciones".');
        }

        for (const cancion of colaReproduccion.canciones) {
            if (!('id' in cancion) || !('nombre' in cancion) || !('duracion' in cancion) ||
                !('numReproducciones' in cancion) || !('numFavoritos' in cancion) || !('portada' in cancion)) {
                throw new BadRequestException('Formato de canciones incorrecto.');
            }
        }

        if (posicionCola < 0 || posicionCola >= colaReproduccion.canciones.length) {
            throw new BadRequestException('La posición indicada no es válida.');
        }

        let canciones = [...colaReproduccion.canciones];

        if (reproduccionAleatoria) {
            const cancionFija = canciones.splice(posicionCola, 1)[0];
            canciones = canciones.sort(() => Math.random() - 0.5);
            canciones.unshift(cancionFija);
            posicionCola = 0;
        }

        // Update en la tabla usuario
        await this.prisma.usuario.update({
            where: { Email: userEmail },
            data: {
                ColaReproduccion: { canciones },
                PosicionCola: posicionCola,
            },
        });

        const cancionActual = canciones[posicionCola];

        return {
            message: 'Cola de reproducción actualizada correctamente',
            idPrimeraCancion: cancionActual.id,
        };
    }

    async getUserQueue(userEmail: string) {
        // Verificamos que el usuario exista y recuperamos la cola + posición
        const user = await this.prisma.usuario.findUnique({
            where: { Email: userEmail },
            select: {
                ColaReproduccion: true,
                PosicionCola: true,
            },
        });

        if (!user) {
            throw new NotFoundException('Usuario no encontrado.');
        }

        return {
            ColaReproduccion: user.ColaReproduccion || { canciones: [] },
            PosicionCola: user.PosicionCola ?? 0,
        };
    }

    async siguienteCancion(userEmail: string) {
        const user = await this.prisma.usuario.findUnique({
            where: { Email: userEmail },
            select: {
                ColaReproduccion: true,
                PosicionCola: true,
            },
        });

        if (!user) {
            throw new NotFoundException('Usuario no encontrado.');
        }

        const cola = user.ColaReproduccion as { canciones: any[] };

        if (!cola || !Array.isArray(cola.canciones) || cola.canciones.length === 0) {
            throw new BadRequestException('La cola de reproducción está vacía o mal formada.');
        }

        // Calculamos la nueva posición (circular)
        let nuevaPosicion = ((user.PosicionCola ?? 0) + 1) % cola.canciones.length;

        const nextSong = cola.canciones[nuevaPosicion];

        if (!nextSong || typeof nextSong !== 'object' || !('id' in nextSong)) {
            throw new BadRequestException('Formato de canción inválido.');
        }

        // Actualizamos la nueva posición en la base de datos
        await this.prisma.usuario.update({
            where: { Email: userEmail },
            data: { PosicionCola: nuevaPosicion },
        });

        return {
            siguienteCancionId: nextSong.id,
        };
    }

    async cancionAnterior(userEmail: string) {
        const user = await this.prisma.usuario.findUnique({
            where: { Email: userEmail },
            select: {
                ColaReproduccion: true,
                PosicionCola: true,
            },
        });

        if (!user) {
            throw new NotFoundException('Usuario no encontrado.');
        }

        const cola = user.ColaReproduccion as { canciones: any[] };

        if (!cola || !Array.isArray(cola.canciones) || cola.canciones.length === 0) {
            throw new BadRequestException('La cola de reproducción está vacía o mal formada.');
        }

        let nuevaPosicion = user.PosicionCola ?? 0;

        // Si NO estamos en la posición 0, retrocedemos una posición
        if (nuevaPosicion > 0) {
            nuevaPosicion--;
        }

        const previousSong = cola.canciones[nuevaPosicion];

        if (!previousSong || typeof previousSong !== 'object' || !('id' in previousSong)) {
            throw new BadRequestException('Formato de canción inválido.');
        }

        // Actualizamos la nueva posición en la base de datos
        await this.prisma.usuario.update({
            where: { Email: userEmail },
            data: { PosicionCola: nuevaPosicion },
        });

        return {
            cancionAnteriorId: previousSong.id,
        };
    }

}
