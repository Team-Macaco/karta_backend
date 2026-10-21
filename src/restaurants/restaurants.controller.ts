import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RestaurantsService } from './restaurants.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { UpsertLocationDto } from './dto/upsert-location.dto';
import { UpsertHoursDto } from './dto/upsert-hours.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UseGuards } from '@nestjs/common';

@ApiTags('restaurants')
@ApiBearerAuth()
@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('owner', 'admin')
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateRestaurantDto) {
    return this.restaurantsService.create(user.id, dto);
  }

  @Get('mine')
  @UseGuards(RolesGuard)
  @Roles('owner', 'admin')
  mine(@CurrentUser() user: { id: string }) {
    return this.restaurantsService.listMine(user.id);
  }

  @Public()
  @Get(':id')
  getPublic(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('dayOfWeek') dayOfWeek?: string,
    @Query('time') time?: string,
  ) {
    return this.restaurantsService.getPublic(
      id,
      dayOfWeek !== undefined ? Number(dayOfWeek) : undefined,
      time,
    );
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('owner', 'admin')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string; role: string },
    @Body() dto: UpdateRestaurantDto,
  ) {
    return this.restaurantsService.update(id, user.id, user.role, dto);
  }

  @Post(':id/submit')
  @UseGuards(RolesGuard)
  @Roles('owner', 'admin')
  submit(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.restaurantsService.submitForReview(id, user.id, user.role);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('admin')
  updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateStatusDto) {
    return this.restaurantsService.updateStatus(id, dto.status);
  }

  @Put(':id/location')
  @UseGuards(RolesGuard)
  @Roles('owner', 'admin')
  upsertLocation(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string; role: string },
    @Body() dto: UpsertLocationDto,
  ) {
    return this.restaurantsService.upsertLocation(id, user.id, user.role, dto);
  }

  @Put(':id/hours')
  @UseGuards(RolesGuard)
  @Roles('owner', 'admin')
  upsertHours(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string; role: string },
    @Body() dto: UpsertHoursDto,
  ) {
    return this.restaurantsService.upsertHours(id, user.id, user.role, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('owner', 'admin')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.restaurantsService.remove(id, user.id, user.role);
  }
}
