import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MapService } from './map.service';
import { NearbyQueryDto } from './dto/nearby-query.dto';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('map')
@Controller('map')
export class MapController {
  constructor(private readonly mapService: MapService) {}

  @Public()
  @Get('nearby')
  nearby(@Query() query: NearbyQueryDto) {
    return this.mapService.nearby(query);
  }
}
