import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async track(dto: CreateEventDto, userId?: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: dto.restaurantId },
    });
    if (!restaurant) throw new NotFoundException('Restaurante no encontrado');

    await this.prisma.analyticsEvent.create({
      data: {
        restaurantId: dto.restaurantId,
        userId: userId ?? dto.userId ?? null,
        eventType: dto.eventType,
      },
    });

    return { ok: true };
  }

  async summary(restaurantId: string, userId: string, role: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });
    if (!restaurant) throw new NotFoundException('Restaurante no encontrado');
    if (role !== 'admin' && restaurant.ownerId !== userId) {
      throw new ForbiddenException('No eres el dueño de este restaurante');
    }

    const grouped = await this.prisma.analyticsEvent.groupBy({
      by: ['eventType'],
      where: { restaurantId },
      _count: { _all: true },
    });

    const total = grouped.reduce((sum, row) => sum + row._count._all, 0);

    return {
      restaurantId,
      total,
      byType: grouped.map((row) => ({
        eventType: row.eventType,
        count: row._count._all,
      })),
    };
  }
}
