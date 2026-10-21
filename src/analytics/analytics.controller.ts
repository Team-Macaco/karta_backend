import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { CreateEventDto } from './dto/create-event.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OptionalJwtGuard } from '../auth/optional-jwt.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('analytics')
@Controller()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Public()
  @UseGuards(OptionalJwtGuard)
  @Post('analytics/events')
  track(
    @Body() dto: CreateEventDto,
    @CurrentUser() user?: { id: string },
  ) {
    return this.analyticsService.track(dto, user?.id);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles('owner', 'admin')
  @Get('restaurants/:id/analytics')
  summary(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.analyticsService.summary(id, user.id, user.role);
  }
}
