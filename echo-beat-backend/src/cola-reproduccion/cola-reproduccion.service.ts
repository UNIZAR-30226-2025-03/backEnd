import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ColaReproduccionService {
    constructor(private prisma: PrismaService) { }

    /**
 * Inicia una nueva cola de reproducción para un usuario, opcionalmente en orden aleatorio.
 * 
 * @param userEmail - Email del usuario.
 * @param reproduccionAleatoria - Indica si se debe reproducir en orden aleatorio.
 * @param colaReproduccion - Objeto JSON con la cola de canciones.
 * @returns Un mensaje y el ID de la primera canción de la cola.
 */
    async iniciarColaReproduccion(userEmail: string, reproduccionAleatoria: boolean, colaReproduccion: any) {
        const user = await this.prisma.usuario.findUnique({
            where: { Email: userEmail },
            select: { Email: true },
        });

        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

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

        if (reproduccionAleatoria) {
            for (let i = canciones.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [canciones[i], canciones[j]] = [canciones[j], canciones[i]];
            }
        }

        await this.prisma.usuario.update({
            where: { Email: userEmail },
            data: {
                ColaReproduccion: { canciones },
                PosicionCola: 0,
            },
        });

        const primeraCancion = canciones[0];

        return {
            message: 'Cola de reproducción actualizada correctamente',
            primeraCancionId: primeraCancion.id,
        };
    }

    /**
 * Inicia una nueva cola de reproducción desde una posición específica.
 * Si `reproduccionAleatoria` es true, reorganiza la cola manteniendo esa canción en primera posición.
 * 
 * @param userEmail - Email del usuario.
 * @param reproduccionAleatoria - Indica si se debe reproducir en orden aleatorio.
 * @param colaReproduccion - Objeto JSON con la cola de canciones.
 * @param posicionCola - Índice desde el que iniciar la reproducción.
 * @returns Mensaje y el ID de la primera canción.
 */
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

    /**
 * Obtiene la cola de reproducción actual del usuario y la posición actual.
 * 
 * @param userEmail - Email del usuario.
 * @returns La cola de reproducción y la posición actual.
 */
    async getUserQueue(userEmail: string) {
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

    /**
 * Avanza a la siguiente canción en la cola (comportamiento circular).
 * 
 * @param userEmail - Email del usuario.
 * @returns El ID de la siguiente canción.
 */
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

        let nuevaPosicion = ((user.PosicionCola ?? 0) + 1) % cola.canciones.length;

        const nextSong = cola.canciones[nuevaPosicion];

        if (!nextSong || typeof nextSong !== 'object' || !('id' in nextSong)) {
            throw new BadRequestException('Formato de canción inválido.');
        }

        await this.prisma.usuario.update({
            where: { Email: userEmail },
            data: { PosicionCola: nuevaPosicion },
        });

        return {
            siguienteCancionId: nextSong.id,
        };
    }

    /**
 * Retrocede a la canción anterior en la cola. Si está en la primera canción, no hace nada.
 * 
 * @param userEmail - Email del usuario.
 * @returns El ID de la canción anterior.
 */
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

        if (nuevaPosicion > 0) {
            nuevaPosicion--;
        }

        const previousSong = cola.canciones[nuevaPosicion];

        if (!previousSong || typeof previousSong !== 'object' || !('id' in previousSong)) {
            throw new BadRequestException('Formato de canción inválido.');
        }

        await this.prisma.usuario.update({
            where: { Email: userEmail },
            data: { PosicionCola: nuevaPosicion },
        });

        return {
            cancionAnteriorId: previousSong.id,
        };
    }

    /**
 * Inserta una nueva canción después de la posición actual en la cola.
 * 
 * @param userEmail - Email del usuario.
 * @param songId - ID de la canción a insertar.
 * @returns La nueva cola de reproducción.
 */
    async addSongToQueue(userEmail: string, songId: number) {
        const user = await this.prisma.usuario.findUnique({
            where: { Email: userEmail },
            select: { ColaReproduccion: true, PosicionCola: true },
        });

        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

        const cola = user.ColaReproduccion as { canciones: any[] };
        const posicionActual = user.PosicionCola ?? 0;

        if (!cola || !Array.isArray(cola.canciones)) {
            throw new BadRequestException('Cola de reproducción inválida o vacía');
        }

        const cancion = await this.prisma.cancion.findUnique({
            where: { Id: songId },
            select: {
                Id: true,
                Nombre: true,
                Duracion: true,
                NumReproducciones: true,
                NumFavoritos: true,
                Portada: true,
            },
        });

        if (!cancion) {
            throw new NotFoundException('Canción no encontrada');
        }

        const nuevaCancion = {
            id: cancion.Id,
            nombre: cancion.Nombre,
            duracion: cancion.Duracion,
            numReproducciones: cancion.NumReproducciones,
            numFavoritos: cancion.NumFavoritos,
            portada: cancion.Portada,
        };

        cola.canciones.splice(posicionActual + 1, 0, nuevaCancion);

        await this.prisma.usuario.update({
            where: { Email: userEmail },
            data: {
                ColaReproduccion: cola,
            },
        });

        return cola;
    }

    /**
 * Elimina una canción de una posición específica en la cola de reproducción.
 * 
 * @param userEmail - Email del usuario.
 * @param posicionCola - Índice de la canción a eliminar.
 * @returns La cola actualizada.
 */
    async deleteSongFromQueue(userEmail: string, posicionCola: number) {
        const user = await this.prisma.usuario.findUnique({
            where: { Email: userEmail },
            select: {
                ColaReproduccion: true,
                PosicionCola: true,
            },
        });

        if (!user || !user.ColaReproduccion) {
            throw new NotFoundException('Usuario no encontrado o no tiene cola de reproducción.');
        }

        const cola = user.ColaReproduccion as { canciones: any[] };

        if (!Array.isArray(cola.canciones) || cola.canciones.length <= posicionCola || posicionCola < 0) {
            throw new BadRequestException('Posición inválida o no existe una canción en esa posición.');
        }

        cola.canciones.splice(posicionCola, 1);

        await this.prisma.usuario.update({
            where: { Email: userEmail },
            data: { ColaReproduccion: cola },
        });

        return cola;
    }

    /**
 * Vacía por completo la cola de reproducción del usuario.
 * 
 * @param userEmail - Email del usuario.
 * @returns Un mensaje de éxito.
 */
    async clearQueue(userEmail: string) {
        const user = await this.prisma.usuario.findUnique({
            where: { Email: userEmail },
        });

        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

        await this.prisma.usuario.update({
            where: { Email: userEmail },
            data: { ColaReproduccion: { canciones: [] }, PosicionCola: 0 },
        });

        return { message: 'Cola de reproducción vacía correctamente' };
    }
}
