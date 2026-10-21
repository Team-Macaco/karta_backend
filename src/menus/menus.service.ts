import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateDishDto } from './dto/create-dish.dto';
import { toNumber } from '../common/utils';

const dishInclude = {
  dietaryTags: { include: { tag: true } },
} satisfies Prisma.DishInclude;

@Injectable()
export class MenusService {
  constructor(private readonly prisma: PrismaService) {}

  async getMenu(restaurantId: string) {
    const restaurant = await this.prisma.restaurant.findFirst({
      where: { id: restaurantId, status: 'active' },
    });
    if (!restaurant) throw new NotFoundException('Restaurante no encontrado');

    const categories = await this.prisma.menuCategory.findMany({
      where: { restaurantId },
      orderBy: { displayOrder: 'asc' },
      include: {
        dishes: {
          where: { isAvailable: true },
          orderBy: { createdAt: 'asc' },
          include: dishInclude,
        },
      },
    });

    return {
      restaurantId,
      restaurantName: restaurant.name,
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        displayOrder: c.displayOrder,
        dishes: c.dishes.map((d) => this.serializeDish(d)),
      })),
    };
  }

  async createCategory(
    restaurantId: string,
    userId: string,
    role: string,
    dto: CreateCategoryDto,
  ) {
    await this.requireOwnedRestaurant(restaurantId, userId, role);
    return this.prisma.menuCategory.create({
      data: {
        restaurantId,
        name: dto.name,
        displayOrder: dto.displayOrder ?? 0,
      },
    });
  }

  async updateCategory(
    categoryId: number,
    userId: string,
    role: string,
    dto: CreateCategoryDto,
  ) {
    const category = await this.requireOwnedCategory(categoryId, userId, role);
    return this.prisma.menuCategory.update({
      where: { id: category.id },
      data: {
        name: dto.name,
        displayOrder: dto.displayOrder,
      },
    });
  }

  async deleteCategory(categoryId: number, userId: string, role: string) {
    const category = await this.requireOwnedCategory(categoryId, userId, role);
    await this.prisma.menuCategory.delete({ where: { id: category.id } });
    return { ok: true };
  }

  async createDish(categoryId: number, userId: string, role: string, dto: CreateDishDto) {
    const category = await this.requireOwnedCategory(categoryId, userId, role);
    const dish = await this.prisma.dish.create({
      data: {
        categoryId: category.id,
        name: dto.name,
        description: dto.description,
        price: dto.price,
        currency: dto.currency ?? 'MXN',
        imageUrl: dto.imageUrl,
        isAvailable: dto.isAvailable ?? true,
        dietaryTags: dto.dietaryTagIds?.length
          ? { create: dto.dietaryTagIds.map((tagId) => ({ tagId })) }
          : undefined,
      },
      include: dishInclude,
    });
    return this.serializeDish(dish);
  }

  async updateDish(dishId: string, userId: string, role: string, dto: CreateDishDto) {
    const dish = await this.requireOwnedDish(dishId, userId, role);

    const updated = await this.prisma.$transaction(async (tx) => {
      if (dto.dietaryTagIds) {
        await tx.dishDietaryTag.deleteMany({ where: { dishId: dish.id } });
        if (dto.dietaryTagIds.length) {
          await tx.dishDietaryTag.createMany({
            data: dto.dietaryTagIds.map((tagId) => ({ dishId: dish.id, tagId })),
          });
        }
      }

      return tx.dish.update({
        where: { id: dish.id },
        data: {
          name: dto.name,
          description: dto.description,
          price: dto.price,
          currency: dto.currency,
          imageUrl: dto.imageUrl,
          isAvailable: dto.isAvailable,
        },
        include: dishInclude,
      });
    });

    return this.serializeDish(updated);
  }

  async deleteDish(dishId: string, userId: string, role: string) {
    const dish = await this.requireOwnedDish(dishId, userId, role);
    await this.prisma.dish.delete({ where: { id: dish.id } });
    return { ok: true };
  }

  private serializeDish(dish: Prisma.DishGetPayload<{ include: typeof dishInclude }>) {
    return {
      id: dish.id,
      categoryId: dish.categoryId,
      name: dish.name,
      description: dish.description,
      price: toNumber(dish.price),
      currency: dish.currency,
      imageUrl: dish.imageUrl,
      isAvailable: dish.isAvailable,
      dietaryTags: dish.dietaryTags.map((t) => t.tag),
    };
  }

  private async requireOwnedRestaurant(restaurantId: string, userId: string, role: string) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant) throw new NotFoundException('Restaurante no encontrado');
    if (role !== 'admin' && restaurant.ownerId !== userId) {
      throw new ForbiddenException('No eres el dueño de este restaurante');
    }
    return restaurant;
  }

  private async requireOwnedCategory(categoryId: number, userId: string, role: string) {
    const category = await this.prisma.menuCategory.findUnique({
      where: { id: categoryId },
      include: { restaurant: true },
    });
    if (!category) throw new NotFoundException('Categoría no encontrada');
    if (role !== 'admin' && category.restaurant.ownerId !== userId) {
      throw new ForbiddenException('No eres el dueño de este restaurante');
    }
    return category;
  }

  private async requireOwnedDish(dishId: string, userId: string, role: string) {
    const dish = await this.prisma.dish.findUnique({
      where: { id: dishId },
      include: { category: { include: { restaurant: true } } },
    });
    if (!dish) throw new NotFoundException('Platillo no encontrado');
    if (role !== 'admin' && dish.category.restaurant.ownerId !== userId) {
      throw new ForbiddenException('No eres el dueño de este restaurante');
    }
    return dish;
  }
}
