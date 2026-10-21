import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MenusService } from './menus.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateDishDto } from './dto/create-dish.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('menus')
@Controller()
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  @Public()
  @Get('restaurants/:id/menu')
  getMenu(@Param('id', ParseUUIDPipe) id: string) {
    return this.menusService.getMenu(id);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles('owner', 'admin')
  @Post('restaurants/:id/categories')
  createCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string; role: string },
    @Body() dto: CreateCategoryDto,
  ) {
    return this.menusService.createCategory(id, user.id, user.role, dto);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles('owner', 'admin')
  @Patch('menu-categories/:id')
  updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: string; role: string },
    @Body() dto: CreateCategoryDto,
  ) {
    return this.menusService.updateCategory(id, user.id, user.role, dto);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles('owner', 'admin')
  @Delete('menu-categories/:id')
  deleteCategory(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.menusService.deleteCategory(id, user.id, user.role);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles('owner', 'admin')
  @Post('menu-categories/:id/dishes')
  createDish(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: string; role: string },
    @Body() dto: CreateDishDto,
  ) {
    return this.menusService.createDish(id, user.id, user.role, dto);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles('owner', 'admin')
  @Patch('dishes/:id')
  updateDish(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string; role: string },
    @Body() dto: CreateDishDto,
  ) {
    return this.menusService.updateDish(id, user.id, user.role, dto);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles('owner', 'admin')
  @Delete('dishes/:id')
  deleteDish(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.menusService.deleteDish(id, user.id, user.role);
  }
}
