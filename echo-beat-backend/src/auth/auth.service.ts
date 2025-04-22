import { Injectable, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
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
    private usersService: UsersService,
    private jwtService: JwtService,
  ) { }

  /**
 * Autentica un usuario verificando sus credenciales y devuelve un token JWT si son válidas.
 * 
 * @param input - Objeto con el email y la contraseña del usuario.
 * @returns Objeto con el token JWT, email y si es admin.
 */
  async authenticate(input: AuthInput): Promise<AuthResult> {
    const Usuario = await this.validateUser(input);
    if (!Usuario) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.signIn(Usuario);
  }

  /**
 * Valida un usuario comprobando su email y contraseña.
 *
 * @param input - Objeto con el email y la contraseña del usuario.
 * @returns Información básica del usuario si es válido o null si no lo es.
 */
  async validateUser(input: AuthInput): Promise<SignInData | null> {
    const Usuario = await this.usersService.findUserByEmail(input.Email);
    if (Usuario && (await bcrypt.compare(input.Password, Usuario.Password))) {
      const esAdmin = await bcrypt.compare(input.Password, process.env.ADMIN_PASSWORD);
      if (esAdmin) {
        console.log("Usuario es admin");
      }
      return {
        Email: Usuario.Email,
        esAdmin: esAdmin,
      };
    }
    return null;
  }

  /**
 * Genera un token JWT para un usuario autenticado.
 *
 * @param Usuario - Objeto con el email del usuario y si es admin.
 * @returns Objeto con token JWT, email y rol de administrador.
 */
  async signIn(Usuario: SignInData): Promise<AuthResult> {
    const tokenPayload = {
      Email: Usuario.Email,
      esAdmin: Usuario.esAdmin,
    };

    const accessToken = await this.jwtService.signAsync(tokenPayload, {
      expiresIn: '1m',
    });

    return { accessToken, Email: Usuario.Email, esAdmin: Usuario.esAdmin };
  }

  /**
 * Envía un correo con enlace para restablecer la contraseña del usuario.
 *
 * @param Email - Correo electrónico del usuario que ha solicitado el cambio.
 * @returns Mensaje indicando que el correo fue enviado.
 */
  async sendPasswordResetEmail(Email: string) {
    const user = await this.usersService.findUserByEmail(Email);
    if (!user) {
      throw new NotFoundException("Este correo no está registrado.");
    }

    const resetToken = this.jwtService.sign(
      { Email: user.Email },
      { secret: process.env.JWT_RESET_SECRET, expiresIn: '1h' }
    );

    //const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const resetLink = `https://echobeatweb.netlify.app/reset-password?token=${resetToken}`;

    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

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

    await transporter.sendMail(mailOptions);

    return { message: "Correo de recuperación enviado." };
  }

  /**
 * Restablece la contraseña de un usuario si el token es válido.
 *
 * @param token - Token JWT enviado al correo del usuario.
 * @param newPassword - Nueva contraseña a establecer.
 * @returns Mensaje indicando si la contraseña fue actualizada.
 */
  async resetPassword(token: string, newPassword: string) {
    try {
      const decoded = this.jwtService.verify(token, { secret: process.env.JWT_RESET_SECRET });

      const user = await this.usersService.findUserByEmail(decoded.Email);
      if (!user) {
        throw new NotFoundException("Usuario no encontrado.");
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await this.usersService.updatePassword(user.Email, hashedPassword);

      return { message: "Contraseña actualizada correctamente." };
    } catch (error) {
      throw new BadRequestException("Token inválido o expirado.");
    }
  }

  /**
 * Valida un usuario que se ha autenticado con Google. Si no existe, lo crea.
 *
 * @param profile - Perfil del usuario devuelto por Google.
 * @returns El usuario validado o creado.
 */
  async validateGoogleUser(profile: any) {
    const { emails, displayName } = profile;
    const email = emails[0].value;

    let user = await this.usersService.findUserByEmail(email);

    if (!user) {
      const randomId = Math.floor(Math.random() * 100000000) + 1;
      const newNick = `echobeatUser_${randomId}`;
      const DEFAULT_BIRTHDATE = new Date('2000-01-01');

      user = await this.usersService.createUser(
        email,
        displayName || "Usuario de Google",
        "",
        newNick,
        DEFAULT_BIRTHDATE
      );
    }
    return user;
  }

  /**
   * Genera un token JWT para un usuario autenticado con Google.
   *
   * @param user - Objeto del usuario autenticado.
   * @returns Objeto con el token y datos del usuario.
   */
  async loginWithGoogle(user: any) {
    const payload = { email: user.email, sub: user.id };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  /**
 * Verifica si un token JWT es válido o está caducado.
 *
 * @param token - Token JWT a validar.
 * @returns Información sobre la validez del token y los datos del usuario si es válido.
 */
  async validateToken(token: string) {
    try {
      const decoded = this.jwtService.verify(token, { secret: process.env.JWT_SECRET });

      return {
        message: 'Token válido',
        user: decoded,
      };
    } catch (error) {
      return {
        message: 'Token inválido o caducado',
      };
    }
  }



}

