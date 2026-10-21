import { Controller, Delete, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FavoritesService } from './favorites.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('favorites')
@ApiBearerAuth()
@Controller('me/favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get('places')
  listPlaces(@CurrentUser() user: { id: string }) {
    return this.favoritesService.listPlaces(user.id);
  }

  @Post('places/:restaurantId')
  savePlace(
    @CurrentUser() user: { id: string },
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
  ) {
    return this.favoritesService.savePlace(user.id, restaurantId);
  }

  @Delete('places/:restaurantId')
  removePlace(
    @CurrentUser() user: { id: string },
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
  ) {
    return this.favoritesService.removePlace(user.id, restaurantId);
  }

  @Get('dishes')
  listDishes(@CurrentUser() user: { id: string }) {
    return this.favoritesService.listDishes(user.id);
  }

  @Post('dishes/:dishId')
  saveDish(
    @CurrentUser() user: { id: string },
    @Param('dishId', ParseUUIDPipe) dishId: string,
  ) {
    return this.favoritesService.saveDish(user.id, dishId);
  }

  @Delete('dishes/:dishId')
  removeDish(
    @CurrentUser() user: { id: string },
    @Param('dishId', ParseUUIDPipe) dishId: string,
  ) {
    return this.favoritesService.removeDish(user.id, dishId);
  }
}
