import { Body, Controller, HttpCode, HttpStatus, Post, Get, Query } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ColaReproduccionService } from './cola-reproduccion.service';

@Controller('cola-reproduccion')
export class ColaReproduccionController {
    constructor(private readonly colaReproduccionService: ColaReproduccionService) { }

    /**
 * Inicializa la cola de reproducción para un usuario con o sin aleatoriedad.
 * 
 * @param input - Objeto que incluye el email del usuario, si se reproduce aleatoriamente y el JSON de la cola.
 * @returns El ID de la primera canción y mensaje de confirmación.
 */
    @ApiOperation({ summary: 'Reproducir una playlist' })
    @ApiResponse({ status: 200, description: 'Cola de reproducción actualizada correctamente e identificador de canción devuelto.' })
    @ApiResponse({ status: 400, description: 'Formato de JSON inválido o parámetros incorrectos.' })
    @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
    @Post('play-list')
    @HttpCode(HttpStatus.OK)
    @ApiBody({
        description: 'Datos para inicializar la cola de reproducción',
        schema: {
            type: 'object',
            properties: {
                userEmail: { type: 'string', example: 'usuario@example.com' },
                reproduccionAleatoria: { type: 'boolean', example: true },
                colaReproduccion: {
                    type: 'object',
                    example: {
                        canciones: [
                            {
                                id: 1,
                                nombre: 'J\'m\'e FPM',
                                duracion: 183,
                                numReproducciones: 0,
                                numFavoritos: 0,
                                portada: 'https://cdn/portada.jpg',
                            },
                            {
                                id: 2,
                                nombre: 'Trio HxC',
                                duracion: 200,
                                numReproducciones: 0,
                                numFavoritos: 0,
                                portada: 'https://cdn/portada2.jpg',
                            },
                        ],
                    },
                },
            },
        },
    })
    async iniciarColaReproduccion(
        @Body() input: { userEmail: string; reproduccionAleatoria: boolean; colaReproduccion: any },
    ) {
        return await this.colaReproduccionService.iniciarColaReproduccion(
            input.userEmail,
            input.reproduccionAleatoria,
            input.colaReproduccion,
        );
    }

    /**
 * Inicializa la cola de reproducción comenzando desde una posición específica.
 * 
 * @param input - Objeto con el correo del usuario, cola, posición inicial y modo aleatorio.
 * @returns ID de la canción seleccionada como inicio.
 */
    @ApiOperation({ summary: 'Establecer la cola de reproducción con posición personalizada' })
    @ApiResponse({ status: 200, description: 'Cola de reproducción actualizada y primera canción devuelta.' })
    @ApiResponse({ status: 400, description: 'Error de validación o datos incorrectos.' })
    @Post('play-list-by-position')
    @HttpCode(HttpStatus.OK)
    @ApiBody({
        description: 'Datos para inicializar la cola de reproducción',
        schema: {
            type: 'object',
            properties: {
                userEmail: { type: 'string', example: 'usuario@example.com' },
                reproduccionAleatoria: { type: 'boolean', example: true },
                posicionCola: { type: 'int', example: 0 },
                colaReproduccion: {
                    type: 'object',
                    example: {
                        canciones: [
                            {
                                id: 1,
                                nombre: 'J\'m\'e FPM',
                                duracion: 183,
                                numReproducciones: 0,
                                numFavoritos: 0,
                                portada: 'https://cdn/portada.jpg',
                            },
                            {
                                id: 2,
                                nombre: 'Trio HxC',
                                duracion: 200,
                                numReproducciones: 0,
                                numFavoritos: 0,
                                portada: 'https://cdn/portada2.jpg',
                            },
                        ],
                    },
                },
            },
        },
    })
    async setQueueWithPosition(@Body() input: { userEmail: string; reproduccionAleatoria: boolean; colaReproduccion: any; posicionCola: number }) {
        return await this.colaReproduccionService.iniciarColaReproduccionPorPosicion(
            input.userEmail,
            input.reproduccionAleatoria,
            input.colaReproduccion,
            input.posicionCola
        );
    }

    /**
 * Recupera la cola de reproducción y la posición actual de un usuario.
 * 
 * @param userEmail - Correo del usuario.
 * @returns Cola y posición actual.
 */
    @ApiOperation({ summary: 'Obtener la cola de reproducción y la posición actual de un usuario' })
    @ApiQuery({ name: 'userEmail', type: 'string', example: 'usuario@example.com' })
    @ApiResponse({ status: 200, description: 'Cola y posición obtenidas correctamente.' })
    @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
    @Get('get-user-queue')
    async getUserQueue(@Query('userEmail') userEmail: string) {
        return this.colaReproduccionService.getUserQueue(userEmail);
    }

    /**
 * Avanza a la siguiente canción en la cola de reproducción del usuario.
 * 
 * @param userEmail - Correo del usuario.
 * @returns ID de la siguiente canción.
 */
    @ApiOperation({ summary: 'Obtener la siguiente canción de la cola de reproducción' })
    @ApiQuery({ name: 'userEmail', type: 'string', example: 'usuario@example.com' })
    @ApiResponse({ status: 200, description: 'ID de la siguiente canción obtenido.' })
    @ApiResponse({ status: 400, description: 'Cola vacía o fin de la cola.' })
    @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
    @Get('siguiente-cancion')
    async siguienteCancion(@Query('userEmail') userEmail: string) {
        return this.colaReproduccionService.siguienteCancion(userEmail);
    }

    /**
 * Retrocede a la canción anterior en la cola del usuario.
 * 
 * @param userEmail - Correo del usuario.
 * @returns ID de la canción anterior.
 */
    @ApiOperation({ summary: 'Retroceder a la canción anterior en la cola' })
    @ApiQuery({ name: 'userEmail', type: 'string', example: 'usuario@example.com' })
    @ApiResponse({ status: 200, description: 'Canción anterior devuelta correctamente.' })
    @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
    @ApiResponse({ status: 400, description: 'Cola vacía o error en formato.' })
    @Get('anterior')
    @HttpCode(HttpStatus.OK)
    async cancionAnterior(@Query('userEmail') userEmail: string) {
        return await this.colaReproduccionService.cancionAnterior(userEmail);
    }

    /**
 * Añade una nueva canción justo después de la posición actual de reproducción.
 * 
 * @param body - Email del usuario y ID de la canción a añadir.
 * @returns Mensaje y la cola actualizada.
 */
    @ApiOperation({ summary: 'Añadir canción a la cola de reproducción después de la posición actual' })
    @ApiResponse({ status: 200, description: 'Canción añadida a la cola correctamente y se devuelve la nueva cola.' })
    @ApiResponse({ status: 404, description: 'Usuario o canción no encontrada.' })
    @ApiResponse({ status: 400, description: 'Cola inválida o datos incorrectos.' })
    @ApiBody({
        description: 'Parámetros necesarios para añadir una canción a la cola',
        schema: {
            type: 'object',
            properties: {
                userEmail: { type: 'string', example: 'user@example.com' },
                songId: { type: 'number', example: 1 },
            },
        },
    })
    @Post('add-song-to-queue')
    async addSongToQueue(
        @Body() body: { userEmail: string; songId: number },
    ) {
        const result = await this.colaReproduccionService.addSongToQueue(body.userEmail, body.songId);

        return {
            message: 'Canción añadida correctamente',
            nuevaCola: result,
        };
    }

    /**
 * Elimina una canción de la cola del usuario en una posición específica.
 * 
 * @param body - Email del usuario y posición de la canción a eliminar.
 * @returns Mensaje y cola actualizada.
 */
    @ApiOperation({
        summary: 'Eliminar una canción de la cola de reproducción en una posición dada',
        description: 'Elimina la canción en la posición indicada y ajusta las posiciones de las canciones restantes.',
    })
    @ApiResponse({ status: 200, description: 'Canción eliminada correctamente y nueva cola devuelta.' })
    @ApiResponse({ status: 400, description: 'Datos inválidos o posición fuera de rango.' })
    @ApiResponse({ status: 404, description: 'Usuario o cola de reproducción no encontrada.' })
    @ApiBody({
        description: 'Parámetros necesarios para eliminar una canción de la cola',
        schema: {
            type: 'object',
            properties: {
                userEmail: { type: 'string', example: 'user@example.com' },
                posicionCola: { type: 'number', example: 1 },
            },
        },
    })
    @Post('delete-song-from-queue')
    async deleteSongFromQueue(
        @Body() body: { userEmail: string; posicionCola: number },
    ) {
        const nuevaCola = await this.colaReproduccionService.deleteSongFromQueue(body.userEmail, body.posicionCola);

        return {
            message: 'Canción eliminada correctamente',
            nuevaCola,
        };
    }

    /**
 * Vacía completamente la cola de reproducción de un usuario.
 * 
 * @param body - Email del usuario.
 * @returns Mensaje de confirmación.
 */
    @ApiOperation({
        summary: 'Vaciar la cola de reproducción de un usuario',
        description: 'Esta API vacía el array de canciones de la cola de reproducción de un usuario.',
    })
    @ApiResponse({ status: 200, description: 'Cola de reproducción vacía correctamente.' })
    @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
    @ApiBody({
        description: 'Datos para vaciar la cola de reproducción',
        schema: {
            type: 'object',
            properties: {
                userEmail: { type: 'string', example: 'user@example.com' },
            },
        },
    })
    @Post('clear')
    @HttpCode(HttpStatus.OK)
    async clearQueue(@Body() body: { userEmail: string }) {
        return await this.colaReproduccionService.clearQueue(body.userEmail);
    }
}
