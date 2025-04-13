import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private jwtService: JwtService
    ) { }

    /**
 * Verifica si una solicitud puede continuar en función de un token JWT válido.
 * Extrae el token del header `Authorization`, lo valida y asigna el usuario a la request.
 *
 * @param context - Contexto de ejecución que contiene detalles sobre la solicitud actual.
 * @returns Una promesa que resuelve en `true` si el token es válido, o lanza una excepción si no lo es.
 * @throws UnauthorizedException si no hay token o el token es inválido.
 */
    async canActivate(context: ExecutionContext) {
        const request = context.switchToHttp().getRequest();
        const authorization = request.headers.authorization;
        const token = authorization?.split(' ')[1]

        if (!token) {
            throw new UnauthorizedException();
        }
        try {
            const tokenPayload = await this.jwtService.verifyAsync(token);
            request.Usuario = {
                Email: tokenPayload.Email
            }
            return true;
        } catch (error) {
            throw new UnauthorizedException();
        }
    }
}