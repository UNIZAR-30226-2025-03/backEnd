import { Controller, Get, Post, Patch, Delete, Param, Body, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminAuthGuard } from './admin-auth.guard'; // Asegúrate de que la ruta sea la correcta

@ApiTags('Admin')
@Controller('admin')
@UseGuards(AdminAuthGuard)  
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


}
