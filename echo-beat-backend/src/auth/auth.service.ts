import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';

type AuthInput = { username: string; password: string };
type SignInData = { username: string };
type AuthResult = { accessToken: string; username: string };

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService, // Servicio de usuarios para interactuar con la BD
    private jwtService: JwtService, // Servicio JWT para firmar tokens
  ) {}

  // Método principal para autenticar
  async authenticate(input: AuthInput): Promise<AuthResult> {
    const user = await this.validateUser(input); // Valida usuario
    if (!user) {
      throw new UnauthorizedException('Invalid credentials'); // Lanza excepción si no es válido
    }

    return this.signIn(user); // Devuelve el token firmado
  }

  // Valida las credenciales del usuario
  async validateUser(input: AuthInput): Promise<SignInData | null> {
    const user = await this.usersService.findUserByUsername(input.username); // Busca usuario por nombre
    if (user && (await bcrypt.compare(input.password, user.password))) {
      // Compara la contraseña cifrada
      return {
        username: user.username,
      };
    }
    return null; // Devuelve null si las credenciales no coinciden
  }

  // Firma el token JWT
  async signIn(user: SignInData): Promise<AuthResult> {
    const tokenPayload = {
      username: user.username,
    };

    const accessToken = await this.jwtService.signAsync(tokenPayload); // Firma el token JWT
    return { accessToken, username: user.username }; // Devuelve el token y los datos del usuario
  }
}
