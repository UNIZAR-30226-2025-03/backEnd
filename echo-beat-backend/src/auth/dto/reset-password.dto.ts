import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  Token: string;

  @IsString()
  @MinLength(6)
  NewPassword: string;
}
