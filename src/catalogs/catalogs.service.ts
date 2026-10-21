import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CatalogsService {
  constructor(private readonly prisma: PrismaService) {}

  listCuisines() {
    return this.prisma.cuisine.findMany({ orderBy: { name: 'asc' } });
  }

  listDietaryTags() {
    return this.prisma.dietaryTag.findMany({ orderBy: { name: 'asc' } });
  }
}
