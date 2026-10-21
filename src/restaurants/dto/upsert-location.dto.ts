import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpsertLocationDto {
  @ApiProperty({ example: 'Av. Álvaro Obregón 123' })
  @IsString()
  addressLine: string;

  @ApiPropertyOptional({ example: 'Roma Norte' })
  @IsOptional()
  @IsString()
  neighborhood?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiPropertyOptional({ example: 'Ciudad de México' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'CDMX' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ example: 19.4194 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ example: -99.1624 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;
}
