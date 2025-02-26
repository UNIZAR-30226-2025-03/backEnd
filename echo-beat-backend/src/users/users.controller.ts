import { Controller, Get, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Obtener la última canción escuchada por el usuario y la lista/álbum a la que pertenece' })
  @ApiResponse({ status: 200, description: 'Datos obtenidos correctamente.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  @Get('last-played')
  async getUserLastPlayedData(@Query('userEmail') userEmail: string) {
    return this.usersService.getUserLastPlayedData(userEmail);
  }
}
