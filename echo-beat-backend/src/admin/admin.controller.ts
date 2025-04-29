import { Controller, Get, Post, Patch, Delete, Param, Body, HttpStatus, UseGuards, UploadedFile, UploadedFiles, UseInterceptors, HttpCode, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { AdminService } from './admin.service';
//import { AdminAuthGuard } from './admin-auth.guard';
import { FileInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';


@ApiTags('Admin')
@Controller('admin')
//@UseGuards(AdminAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) { }

  @Get('playlists')
  @ApiOperation({
    summary: 'Obtener listas de reproducción predefinidas',
    description: 'Devuelve todas las listas de reproducción administradas por el administrador del sistema.'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Listas encontradas correctamente',
    type: [Object]
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'No autorizado' })
  async getPredefinedPlaylists() {
    return this.adminService.findAllPredefinedPlaylists();
  }

  @Delete('users/:email')
  @ApiOperation({
    summary: 'Eliminar usuario por correo electrónico',
    description: 'Elimina un usuario dado su correo electrónico. Retorna un mensaje de confirmación o un error si el usuario no existe.'
  })
  @ApiParam({
    name: 'email',
    description: 'Correo electrónico del usuario a eliminar'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Usuario eliminado correctamente'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Usuario no encontrado'
  })
  async deleteUser(@Param('email') email: string) {
    return this.adminService.deleteUser(email);
  }

  @Get('users')
  @ApiOperation({
    summary: 'Obtener todos los usuarios',
    description: 'Devuelve una lista con todos los usuarios de la aplicación.'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Usuarios obtenidos correctamente',
    type: [Object]
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'No autorizado'
  })
  async getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Get('data')
  @ApiOperation({
    summary: 'Obtener todos los datos de la aplicación',
    description: 'Devuelve todos los datos de la aplicación, incluyendo usuarios, listas de reproducción y canciones.'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Datos obtenidos correctamente',
    type: [Object]
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'No autorizado'
  })
  async getExportData() {
    // Llama al servicio que extrae la información y la devuelve
    const data = await this.adminService.exportAllData();
    return data;
  }

  /**
     * Crea un nuevo artista en la base de datos a partir de nombre, biografía, número de oyentes y una imagen de perfil.
     * @param body Objeto con nombre, biografía y número de oyentes
     * @param foto Archivo de imagen para el perfil del artista
     * @returns Objeto del artista creado
     */
  @Post('artistas')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('foto'))
  @ApiOperation({
    summary: 'Crear un nuevo artista',
    description:
      'Crea un artista con nombre único, biografía, número de oyentes y una foto de perfil',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Formulario para crear artista',
    schema: {
      type: 'object',
      properties: {
        nombre: {
          type: 'string',
          example: 'Bad Bunny',
        },
        biografia: {
          type: 'string',
          example: 'Artista de trap y reggaetón puertorriqueño.',
        },
        foto: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['nombre', 'biografia', 'foto'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Artista creado correctamente.',
  })
  @ApiResponse({
    status: 400,
    description: 'Todos los campos son obligatorios.',
  })
  @ApiResponse({
    status: 409,
    description: 'El nombre del artista ya existe.',
  })
  async createArtista(
    @Body()
    body: {
      nombre: string;
      biografia: string;
    },
    @UploadedFile() foto: Express.Multer.File,
  ) {
    return this.adminService.createArtista(
      body.nombre,
      body.biografia,
      foto,
    );
  }

  @Post('canciones')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'foto', maxCount: 1 },
      { name: 'mp3', maxCount: 1 },
    ]),
  )
  @ApiOperation({
    summary: 'Crear una canción con portada y archivo MP3',
    description:
      'Crea una nueva canción subiendo la portada a Azure Blob Storage (CONTAINER_SONG_PHOTOS) y el archivo MP3 (CONTAINER_SONGS). También asocia la canción y el álbum creado al artista proporcionado.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Formulario para crear una canción',
    schema: {
      type: 'object',
      properties: {
        NombreCancion: { type: 'string', example: 'Mi Canción Nueva' },
        GeneroCancion: { type: 'string', example: 'Pop' },
        nombreArtista: { type: 'string', example: 'Bad Bunny' },
        foto: { type: 'string', format: 'binary' },
        mp3: { type: 'string', format: 'binary' },
      },
      required: ['NombreCancion', 'GeneroCancion', 'nombreArtista', 'foto', 'mp3'],
    },
  })
  @ApiResponse({ status: 201, description: 'Canción creada correctamente' })
  @ApiResponse({ status: 400, description: 'Faltan datos o archivos inválidos' })
  @ApiResponse({ status: 404, description: 'Artista no encontrado' })
  async crearCancionSeparada(
    @Body()
    body: {
      NombreCancion: string;
      GeneroCancion: string;
      nombreArtista: string;
    },
    @UploadedFiles()
    files: {
      foto?: Express.Multer.File[];
      mp3?: Express.Multer.File[];
    },
  ) {
    if (!body.NombreCancion || !body.GeneroCancion || !body.nombreArtista) {
      throw new BadRequestException('Todos los campos de texto son obligatorios.');
    }
  
    if (!files.foto?.[0] || !files.mp3?.[0]) {
      throw new BadRequestException('Faltan archivos obligatorios.');
    }
  
    const foto = files.foto[0];
    const mp3 = files.mp3[0];
  
    return this.adminService.crearCancionCompleta(
      body.NombreCancion,
      body.GeneroCancion,
      foto,
      mp3,
      body.nombreArtista,
    );
  }
}
