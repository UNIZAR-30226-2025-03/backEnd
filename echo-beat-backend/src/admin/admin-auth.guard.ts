// import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from "@nestjs/common";
// import { JwtService } from "@nestjs/jwt";

// @Injectable()
// export class AdminAuthGuard implements CanActivate {
//   constructor(private jwtService: JwtService) {}

//   /**
//    * Permite continuar con la ejecución de la solicitud si se valida un token JWT
//    * correctamente y el usuario decodificado tiene permisos de administrador.
//    *
//    * Extrae el token del header `Authorization`, lo valida y asigna el payload del token a `request.user`.
//    *
//    * @param context - Contexto de ejecución que contiene detalles sobre la solicitud actual.
//    * @returns Una promesa que resuelve en `true` si el token es válido y el usuario es admin, o lanza una excepción.
//    * @throws UnauthorizedException si no hay token, el token es inválido, o el usuario no es administrador.
//    */
//   async canActivate(context: ExecutionContext): Promise<boolean> {
//     const request = context.switchToHttp().getRequest();
//     const authorizationHeader = request.headers.authorization;

//     if (!authorizationHeader) {
//       console.error('Error: No se proporcionó un token de autenticación.');
//       throw new UnauthorizedException('No se proporcionó un token de autenticación.');
//     }

//     // Se asume el formato "Bearer <token>"
//     const parts = authorizationHeader.split(' ');
//     if (parts.length !== 2 || parts[0] !== 'Bearer') {
//       console.error('Error: El formato del token es inválido.');
//       throw new UnauthorizedException('El formato del token es inválido.');
//     }

//     const token = parts[1];

//     try {
//       // Verifica y decodifica el token
//       const tokenPayload = await this.jwtService.verifyAsync(token);
//       // Se asigna el payload decodificado a `request.user`
//       request.user = tokenPayload;

//       // Verifica que el usuario tenga permisos de administrador
//       if (!tokenPayload.esAdmin) {
//         console.error('Error: El usuario no tiene permisos de administrador.');
//         throw new UnauthorizedException('No tienes permisos para acceder a esta ruta.');
//       }
      
//       // Si todo es correcto, permite continuar la ejecución
//       return true;
//     } catch (error) {
//       console.error('Error: Token inválido o expirado.', error);
//       throw new UnauthorizedException('Token inválido o expirado.');
//     }
//   }
// }
