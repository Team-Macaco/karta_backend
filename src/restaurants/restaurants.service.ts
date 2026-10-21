import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { UpsertLocationDto } from './dto/upsert-location.dto';
import { UpsertHoursDto } from './dto/upsert-hours.dto';
import { hhMmToDate, isOpenNow, timeToHhMm, toNumber } from '../common/utils';

const restaurantInclude = {
  location: true,
  businessHours: { orderBy: { dayOfWeek: 'asc' as const } },
  cuisines: { include: { cuisine: true } },
} satisfies Prisma.RestaurantInclude;

@Injectable()
export class RestaurantsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(ownerId: string, dto: CreateRestaurantDto) {
    return this.prisma.restaurant.create({
      data: {
        ownerId,
        name: dto.name,
        description: dto.description,
        phone: dto.phone,
        email: dto.email,
        status: 'draft',
        cuisines: dto.cuisineIds?.length
          ? {
              create: dto.cuisineIds.map((cuisineId) => ({ cuisineId })),
            }
          : undefined,
      },
      include: restaurantInclude,
    }).then((r) => this.serialize(r));
  }

  async listMine(ownerId: string) {
    const rows = await this.prisma.restaurant.findMany({
      where: { ownerId },
      include: restaurantInclude,
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map((r) => this.serialize(r));
  }

  async getPublic(id: string, dayOfWeek?: number, timeHhMm?: string) {
    const restaurant = await this.prisma.restaurant.findFirst({
      where: { id, status: 'active' },
      include: restaurantInclude,
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurante no encontrado');
    }

    return this.serialize(restaurant, dayOfWeek, timeHhMm);
  }

  async getOwned(id: string, userId: string, role: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
      include: restaurantInclude,
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurante no encontrado');
    }

    this.assertOwner(restaurant.ownerId, userId, role);
    return this.serialize(restaurant);
  }

  async update(id: string, userId: string, role: string, dto: UpdateRestaurantDto) {
    const restaurant = await this.requireOwned(id, userId, role);

    const updated = await this.prisma.$transaction(async (tx) => {
      if (dto.cuisineIds) {
        await tx.restaurantCuisine.deleteMany({ where: { restaurantId: id } });
        if (dto.cuisineIds.length) {
          await tx.restaurantCuisine.createMany({
            data: dto.cuisineIds.map((cuisineId) => ({ restaurantId: id, cuisineId })),
          });
        }
      }

      return tx.restaurant.update({
        where: { id: restaurant.id },
        data: {
          name: dto.name,
          description: dto.description,
          phone: dto.phone,
          email: dto.email,
        },
        include: restaurantInclude,
      });
    });

    return this.serialize(updated);
  }

  async submitForReview(id: string, userId: string, role: string) {
    await this.requireOwned(id, userId, role);
    const updated = await this.prisma.restaurant.update({
      where: { id },
      data: { status: 'pending_review' },
      include: restaurantInclude,
    });
    return this.serialize(updated);
  }

  async updateStatus(id: string, status: string) {
    const exists = await this.prisma.restaurant.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Restaurante no encontrado');

    const updated = await this.prisma.restaurant.update({
      where: { id },
      data: { status },
      include: restaurantInclude,
    });
    return this.serialize(updated);
  }

  async upsertLocation(id: string, userId: string, role: string, dto: UpsertLocationDto) {
    await this.requireOwned(id, userId, role);

    const location = await this.prisma.location.upsert({
      where: { restaurantId: id },
      create: {
        restaurantId: id,
        addressLine: dto.addressLine,
        neighborhood: dto.neighborhood,
        zipCode: dto.zipCode,
        city: dto.city,
        state: dto.state,
        latitude: dto.latitude,
        longitude: dto.longitude,
      },
      update: {
        addressLine: dto.addressLine,
        neighborhood: dto.neighborhood,
        zipCode: dto.zipCode,
        city: dto.city,
        state: dto.state,
        latitude: dto.latitude,
        longitude: dto.longitude,
      },
    });

    return this.serializeLocation(location);
  }

  async upsertHours(id: string, userId: string, role: string, dto: UpsertHoursDto) {
    await this.requireOwned(id, userId, role);

    await this.prisma.$transaction([
      this.prisma.businessHour.deleteMany({ where: { restaurantId: id } }),
      this.prisma.businessHour.createMany({
        data: dto.hours.map((hour) => ({
          restaurantId: id,
          dayOfWeek: hour.dayOfWeek,
          openTime: hhMmToDate(hour.openTime),
          closeTime: hhMmToDate(hour.closeTime),
          isClosed: hour.isClosed,
        })),
      }),
    ]);

    const hours = await this.prisma.businessHour.findMany({
      where: { restaurantId: id },
      orderBy: { dayOfWeek: 'asc' },
    });

    return hours.map((h) => this.serializeHour(h));
  }

  async remove(id: string, userId: string, role: string) {
    await this.requireOwned(id, userId, role);
    await this.prisma.restaurant.delete({ where: { id } });
    return { ok: true };
  }

  private async requireOwned(id: string, userId: string, role: string) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id } });
    if (!restaurant) throw new NotFoundException('Restaurante no encontrado');
    this.assertOwner(restaurant.ownerId, userId, role);
    return restaurant;
  }

  private assertOwner(ownerId: string | null, userId: string, role: string) {
    if (role === 'admin') return;
    if (ownerId !== userId) {
      throw new ForbiddenException('No eres el dueño de este restaurante');
    }
  }

  serialize(
    restaurant: Prisma.RestaurantGetPayload<{ include: typeof restaurantInclude }>,
    dayOfWeek?: number,
    timeHhMm?: string,
  ) {
    const nowDay = dayOfWeek ?? new Date().getDay();
    const nowTime = timeHhMm ?? `${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')}`;

    return {
      id: restaurant.id,
      ownerId: restaurant.ownerId,
      name: restaurant.name,
      description: restaurant.description,
      phone: restaurant.phone,
      email: restaurant.email,
      rating: toNumber(restaurant.rating),
      reviewCount: restaurant.reviewCount,
      status: restaurant.status,
      createdAt: restaurant.createdAt,
      updatedAt: restaurant.updatedAt,
      location: restaurant.location ? this.serializeLocation(restaurant.location) : null,
      businessHours: restaurant.businessHours.map((h) => this.serializeHour(h)),
      cuisines: restaurant.cuisines.map((c) => c.cuisine),
      isOpen: isOpenNow(restaurant.businessHours, nowDay, nowTime),
    };
  }

  private serializeLocation(location: Prisma.LocationGetPayload<object>) {
    return {
      id: location.id,
      restaurantId: location.restaurantId,
      addressLine: location.addressLine,
      neighborhood: location.neighborhood,
      zipCode: location.zipCode,
      city: location.city,
      state: location.state,
      latitude: toNumber(location.latitude),
      longitude: toNumber(location.longitude),
    };
  }

  private serializeHour(hour: Prisma.BusinessHourGetPayload<object>) {
    return {
      id: hour.id,
      dayOfWeek: hour.dayOfWeek,
      openTime: timeToHhMm(hour.openTime),
      closeTime: timeToHhMm(hour.closeTime),
      isClosed: hour.isClosed,
    };
  }
}
