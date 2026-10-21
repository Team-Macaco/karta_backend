import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'ava@karta.app' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'secreto123' })
  @IsString()
  @MinLength(8)
  password: string;
}
