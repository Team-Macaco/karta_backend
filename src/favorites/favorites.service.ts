import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { toNumber } from '../common/utils';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  async listPlaces(userId: string) {
    const rows = await this.prisma.userFavoritePlace.findMany({
      where: { userId },
      include: {
        restaurant: {
          include: {
            location: true,
            cuisines: { include: { cuisine: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => ({
      savedAt: row.createdAt,
      restaurant: {
        id: row.restaurant.id,
        name: row.restaurant.name,
        rating: toNumber(row.restaurant.rating),
        reviewCount: row.restaurant.reviewCount,
        status: row.restaurant.status,
        location: row.restaurant.location
          ? {
              addressLine: row.restaurant.location.addressLine,
              neighborhood: row.restaurant.location.neighborhood,
              latitude: toNumber(row.restaurant.location.latitude),
              longitude: toNumber(row.restaurant.location.longitude),
            }
          : null,
        cuisines: row.restaurant.cuisines.map((c) => c.cuisine),
      },
    }));
  }

  async savePlace(userId: string, restaurantId: string) {
    const restaurant = await this.prisma.restaurant.findFirst({
      where: { id: restaurantId, status: 'active' },
    });
    if (!restaurant) throw new NotFoundException('Restaurante no encontrado');

    try {
      await this.prisma.userFavoritePlace.create({
        data: { userId, restaurantId },
      });
    } catch {
      throw new ConflictException('Este lugar ya está en tus favoritos');
    }

    await this.prisma.analyticsEvent.create({
      data: { restaurantId, userId, eventType: 'save' },
    });

    return { ok: true };
  }

  async removePlace(userId: string, restaurantId: string) {
    await this.prisma.userFavoritePlace.deleteMany({
      where: { userId, restaurantId },
    });
    return { ok: true };
  }

  async listDishes(userId: string) {
    const rows = await this.prisma.userFavoriteDish.findMany({
      where: { userId },
      include: {
        dish: {
          include: {
            category: { include: { restaurant: true } },
            dietaryTags: { include: { tag: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => ({
      savedAt: row.createdAt,
      dish: {
        id: row.dish.id,
        name: row.dish.name,
        description: row.dish.description,
        price: toNumber(row.dish.price),
        currency: row.dish.currency,
        imageUrl: row.dish.imageUrl,
        dietaryTags: row.dish.dietaryTags.map((t) => t.tag),
        restaurant: {
          id: row.dish.category.restaurant.id,
          name: row.dish.category.restaurant.name,
        },
      },
    }));
  }

  async saveDish(userId: string, dishId: string) {
    const dish = await this.prisma.dish.findUnique({ where: { id: dishId } });
    if (!dish) throw new NotFoundException('Platillo no encontrado');

    try {
      await this.prisma.userFavoriteDish.create({
        data: { userId, dishId },
      });
    } catch {
      throw new ConflictException('Este platillo ya está en tus favoritos');
    }

    return { ok: true };
  }

  async removeDish(userId: string, dishId: string) {
    await this.prisma.userFavoriteDish.deleteMany({
      where: { userId, dishId },
    });
    return { ok: true };
  }
}
