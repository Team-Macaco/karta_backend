import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsString,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class BusinessHourItemDto {
  @ApiProperty({ description: '0 = domingo ... 6 = sábado', example: 1 })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @ApiProperty({ example: '09:00' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  openTime: string;

  @ApiProperty({ example: '23:00' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  closeTime: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  isClosed: boolean;
}

export class UpsertHoursDto {
  @ApiProperty({ type: [BusinessHourItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BusinessHourItemDto)
  hours: BusinessHourItemDto[];
}
