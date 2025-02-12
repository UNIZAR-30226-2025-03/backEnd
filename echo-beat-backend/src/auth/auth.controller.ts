import { Controller, Get, Post, HttpCode, HttpStatus, NotImplementedException, Body } from '@nestjs/common';

import { AuthService } from './auth.service';
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() input: {username: string, password: string}){
    return this.authService.authenticate(input);
  }

  @Get()
  getHello() {
    return 'Hello World';
  }




}
