import { Controller, Get } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  @Get()
  getHello() {
    return 'Hello World';
  }
}
