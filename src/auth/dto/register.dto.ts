import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Ava Morales' })
  @IsString()
  @MinLength(2)
  fullName: string;

  @ApiProperty({ example: 'ava@karta.app' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'secreto123' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ enum: ['explorer', 'owner'], default: 'explorer' })
  @IsOptional()
  @IsIn(['explorer', 'owner'])
  role?: 'explorer' | 'owner';
}
