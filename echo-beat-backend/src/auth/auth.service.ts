import { Injectable, BadRequestException, NotFoundException,UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';


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


  // Genera y envía el token de recuperación al correo
  async sendPasswordResetEmail(Email: string) {
    const user = await this.usersService.findUserByEmail(Email);
    if (!user) {
      throw new NotFoundException("Este correo no está registrado.");
    }

    // Generamos un token de recuperación con JWT
    const resetToken = this.jwtService.sign(
      { Email: user.Email },
      { secret: process.env.JWT_RESET_SECRET, expiresIn: '1h' }
    );

    // Definir el enlace de restablecimiento
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    // 🔹 Configurar el transporte de nodemailer
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // 🔹 Configurar el correo
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: Email,
      subject: 'Recuperación de Contraseña - GoBeat',
      html: `
        <p>Hola,</p>
        <p>Hemos recibido una solicitud para restablecer tu contraseña.</p>
        <p>Haz clic en el siguiente enlace para cambiarla:</p>
        <a href="${resetLink}">Restablecer Contraseña</a>
        <p>Este enlace expirará en 1 hora.</p>
      `,
    };

    // Enviar el correo
    await transporter.sendMail(mailOptions);

    return { message: "Correo de recuperación enviado."};
  }

  // Validar el token y actualizar la contraseña
  async resetPassword(token: string, newPassword: string) { 
    try {
      // 🔹 Decodificar el token
      const decoded = this.jwtService.verify(token, { secret: process.env.JWT_RESET_SECRET });

      const user = await this.usersService.findUserByEmail(decoded.Email);
      if (!user) {
        throw new NotFoundException("Usuario no encontrado.");
      }

      // 🔹 Hashear la nueva contraseña
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // 🔹 Actualizar la contraseña en la BD
      await this.usersService.updatePassword(user.Email, hashedPassword);

      return { message: "Contraseña actualizada correctamente." };
    } catch (error) {
      throw new BadRequestException("Token inválido o expirado.");
    }
  }

  async validateGoogleUser(profile: any) {
    const { emails } = profile;
    const email = emails[0].value;

    // 🔹 Buscar al usuario en la base de datos
    const user = await this.usersService.findUserByEmail(email);

    if (!user) {
      // ❌ Si el usuario no está registrado, rechazamos la autenticación
      throw new UnauthorizedException('No tienes una cuenta registrada. Regístrate primero.');
    }

    return user;
  }

  async loginWithGoogle(user: any) {
    const payload = { email: user.email, sub: user.id };
    return {
      accessToken: this.jwtService.sign(payload),
      user,
    };
  }


}

