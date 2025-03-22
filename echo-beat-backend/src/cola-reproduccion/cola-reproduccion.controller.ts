import { Body, Controller, HttpCode, HttpStatus, Post, Get, Query } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ColaReproduccionService } from './cola-reproduccion.service';

@Controller('cola-reproduccion')
export class ColaReproduccionController {
    constructor(private readonly colaReproduccionService: ColaReproduccionService) { }

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

    @ApiOperation({ summary: 'Obtener la cola de reproducción y la posición actual de un usuario' })
    @ApiQuery({ name: 'userEmail', type: 'string', example: 'usuario@example.com' })
    @ApiResponse({ status: 200, description: 'Cola y posición obtenidas correctamente.' })
    @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
    @Get('get-user-queue')
    async getUserQueue(@Query('userEmail') userEmail: string) {
        return this.colaReproduccionService.getUserQueue(userEmail);
    }

    @ApiOperation({ summary: 'Obtener la siguiente canción de la cola de reproducción' })
    @ApiQuery({ name: 'userEmail', type: 'string', example: 'usuario@example.com' })
    @ApiResponse({ status: 200, description: 'ID de la siguiente canción obtenido.' })
    @ApiResponse({ status: 400, description: 'Cola vacía o fin de la cola.' })
    @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
    @Get('siguiente-cancion')
    async siguienteCancion(@Query('userEmail') userEmail: string) {
        return this.colaReproduccionService.siguienteCancion(userEmail);
    }

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

}
