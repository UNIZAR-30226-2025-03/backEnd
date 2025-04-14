import { Controller, Get, Post, Patch, Delete, Param, Body, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { AdminService } from './admin.service';

class CreatePlaylistDto {
  name: string;
  description: string;
  isPublic: boolean;
}

class UpdatePlaylistDto {
  name?: string;
  description?: string;
  isPublic?: boolean;
}

class AddSongDto {
  songId: number;
}

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) { }

  /**
* Obtiene todas las listas de reproducción predefinidas creadas por el administrador.
* 
* @returns Arreglo de playlists predefinidas.
*/
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
  } 