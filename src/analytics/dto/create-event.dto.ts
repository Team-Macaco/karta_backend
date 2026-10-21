import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { ANALYTICS_EVENT_TYPES } from '../../common/constants';

export class CreateEventDto {
  @ApiProperty()
  @IsUUID()
  restaurantId: string;

  @ApiProperty({ enum: ANALYTICS_EVENT_TYPES })
  @IsIn(ANALYTICS_EVENT_TYPES)
  eventType: (typeof ANALYTICS_EVENT_TYPES)[number];

  @ApiPropertyOptional({ description: 'Solo se usa si no hay JWT' })
  @IsOptional()
  @IsUUID()
  userId?: string;
}
