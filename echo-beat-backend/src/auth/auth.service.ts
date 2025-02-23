import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

type AuthInput = { Email: string; Password: string };
type SignInData = { Email: string };
type AuthResult = { accessToken: string; Email: string };

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService, // Servicio de Usuarios para interactuar con la BD
    private jwtService: JwtService, // Servicio JWT para firmar tokens
  ) {}

  // Método principal para autenticar
  async authenticate(input: AuthInput): Promise<AuthResult> {
    const Usuario = await this.validateUser(input); // Valida Usuario
    if (!Usuario) {
      throw new UnauthorizedException('Invalid credentials'); // Lanza excepción si no es válido
    }

    return this.signIn(Usuario); // Devuelve el token firmado
  }

  // Valida las credenciales del Usuario
  async validateUser(input: AuthInput): Promise<SignInData | null> {
    const Usuario = await this.usersService.findUserByEmail(input.Email); // Busca Usuario por nombre
    if (Usuario && (await bcrypt.compare(input.Password, Usuario.Password))) {
      // Compara la contraseña cifrada
      return {
        Email: Usuario.Email,
      };
    }
    return null; // Devuelve null si las credenciales no coinciden
  }

  // Firma el token JWT
  async signIn(Usuario: SignInData): Promise<AuthResult> {
    const tokenPayload = {
      Email: Usuario.Email,
    };

    const accessToken = await this.jwtService.signAsync(tokenPayload); // Firma el token JWT
    return { accessToken, Email: Usuario.Email }; // Devuelve el token y los datos del Usuario
  }
}
