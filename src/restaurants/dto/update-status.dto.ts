import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { RESTAURANT_STATUSES } from '../../common/constants';

export class UpdateStatusDto {
  @ApiProperty({ enum: RESTAURANT_STATUSES })
  @IsIn(RESTAURANT_STATUSES)
  status: (typeof RESTAURANT_STATUSES)[number];
}
