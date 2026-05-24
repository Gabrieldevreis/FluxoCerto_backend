import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail({}, { message: 'E-mail inválido.' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Senha deve ter ao menos 6 caracteres.' })
  password: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
