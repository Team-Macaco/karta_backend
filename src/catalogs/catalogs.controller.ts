import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CatalogsService } from './catalogs.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('catalogs')
@Controller()
export class CatalogsController {
  constructor(private readonly catalogsService: CatalogsService) {}

  @Public()
  @Get('cuisines')
  cuisines() {
    return this.catalogsService.listCuisines();
  }

  @Public()
  @Get('dietary-tags')
  dietaryTags() {
    return this.catalogsService.listDietaryTags();
  }
}
