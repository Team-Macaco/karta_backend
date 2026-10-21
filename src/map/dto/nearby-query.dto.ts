import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

function toNumberArray(value: unknown): number[] | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (Array.isArray(value)) return value.map(Number);
  return String(value)
    .split(',')
    .map((v) => Number(v.trim()))
    .filter((n) => !Number.isNaN(n));
}

export class NearbyQueryDto {
  @ApiProperty({ example: 19.4194 })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty({ example: -99.1624 })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;

  @ApiPropertyOptional({ description: 'Radio en metros', example: 800, default: 800 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(50)
  @Max(10000)
  radius?: number;

  @ApiPropertyOptional({ description: 'IDs de cocina separados por coma', example: '1,5' })
  @IsOptional()
  @Transform(({ value }) => toNumberArray(value))
  cuisineIds?: number[];

  @ApiPropertyOptional({ description: 'IDs de dieta separados por coma', example: '2,3' })
  @IsOptional()
  @Transform(({ value }) => toNumberArray(value))
  dietaryTagIds?: number[];

  @ApiPropertyOptional({ description: 'Presupuesto máximo por platillo (MXN)', example: 150 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ example: 'tacos' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: '0 = domingo ... 6 = sábado' })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @ApiPropertyOptional({ example: '13:30' })
  @IsOptional()
  @IsString()
  time?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsBoolean()
  openNow?: boolean;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
