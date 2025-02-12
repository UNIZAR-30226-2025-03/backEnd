import { Injectable } from '@nestjs/common';

export type User = {
    userID: number
    username: string
    password: string
}

//Ejemplos de prueba, aqui tendría que usarse la BD
const users: User[] = [{userID:1,username:'Daniel',password:'123'},{userID:2,username:'Carlos',password:'123456'}]


@Injectable()
export class UsersService {
    async findUserByName(username: string): Promise <User | undefined> {
        return users.find((user) => user.username === username);
    }
}
