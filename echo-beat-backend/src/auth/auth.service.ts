import { Injectable, BadRequestException, NotFoundException,UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';


type AuthInput = { Email: string; Password: string };
type SignInData = { Email: string, esAdmin: boolean };
type AuthResult = { accessToken: string; Email: string, esAdmin: boolean };

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
      const esAdmin = await bcrypt.compare(input.Password, process.env.ADMIN_PASSWORD);
      return {
        Email: Usuario.Email,
        esAdmin: esAdmin,
      };
    }
    return null; // Devuelve null si las credenciales no coinciden
  }

  // Firma el token JWT
  async signIn(Usuario: SignInData): Promise<AuthResult> {
    const tokenPayload = {
      Email: Usuario.Email,
    };
  
    // Firma el token con una caducidad de 1 minuto (60 segundos)
    const accessToken = await this.jwtService.signAsync(tokenPayload, {
      expiresIn: '1m', // Esto establece la caducidad a 1 minuto
    });
  
    return { accessToken, Email: Usuario.Email, esAdmin: Usuario.esAdmin }; // Devuelve el token y los datos del Usuario
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
      subject: 'Recuperación de Contraseña - EchoBeat',
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
    const { emails, displayName } = profile;
    const email = emails[0].value;

    // 🔹 Buscar si el usuario ya existe en la base de datos
    let user = await this.usersService.findUserByEmail(email);

    if (!user) {
        // ❌ Si el usuario no existe, lo registramos automáticamente
        const randomId = Math.floor(Math.random() * 100000000) + 1;
        const newNick = `echobeatUser_${randomId}`;
        const DEFAULT_BIRTHDATE = new Date('2000-01-01');

        user = await this.usersService.createUser(
          email, 
          displayName || "Usuario de Google", // Nombre Completo
          "", // Contraseña
          newNick, // 🔹 Nick ahora va en la posición correcta
          DEFAULT_BIRTHDATE
      );
      
    }

    return user;
 }



  async loginWithGoogle(user: any) {
    const payload = { email: user.email, sub: user.id };
    return {
      accessToken: this.jwtService.sign(payload),
      user: { id: user.id, email: user.email, name: user.name },
    };
  }

  // Función para validar el token
  async validateToken(token: string) {
    try {
      // Verificar el token usando la clave secreta (reemplazar con tu propia clave secreta)
      const decoded = this.jwtService.verify(token, { secret: process.env.JWT_SECRET});

      // Si el token es válido, devolver los datos decodificados (puedes personalizar esto)
      return {
        message: 'Token válido',
        user: decoded,  // Devuelves los datos del usuario decodificados
      };
    } catch (error) {
      // Si el token es inválido o ha caducado
      return {
        message: 'Token inválido o caducado',
      };
    }
  }



}

