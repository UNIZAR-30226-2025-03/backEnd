import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';

type AuthInput = {username: string, password: string}
type SignInData = {userID: number, username: string}
type AuthResult = {accessToken: string; userId: number; username: string};

@Injectable()
export class AuthService {
    constructor(private usersService: UsersService) {}

    async authenticate(input: AuthInput): Promise<AuthResult>{
        const user = await this.validateUser(input);
        if (!user){
            throw new UnauthorizedException
        }
        
        return {
            accessToken: 'fake-token',
            userId: user.userID,
            username: user.username,
        };
    }

    async validateUser(input: AuthInput): Promise<SignInData | null>{
        const user = await this.usersService.findUserByName(input.username)
        if (user && user.password === input.password){
            return {
                userID: user.userID,
                username: user.username
            };
        }
        return null
    }
}
