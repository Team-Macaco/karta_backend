import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NearbyQueryDto } from './dto/nearby-query.dto';
import { isOpenNow, timeToHhMm, toNumber } from '../common/utils';

type NearbyRow = {
  id: string;
  name: string;
  description: string | null;
  rating: Prisma.Decimal;
  review_count: number;
  status: string;
  address_line: string;
  neighborhood: string | null;
  city: string | null;
  latitude: Prisma.Decimal;
  longitude: Prisma.Decimal;
  distance_meters: number;
  cover_image_url: string | null;
  min_price: Prisma.Decimal | null;
};

@Injectable()
export class MapService {
  constructor(private readonly prisma: PrismaService) {}

  async nearby(query: NearbyQueryDto) {
    const radius = query.radius ?? 800;
    const limit = query.limit ?? 50;
    const dayOfWeek = query.dayOfWeek ?? new Date().getDay();
    const time = query.time ?? `${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')}`;

    const cuisineFilter =
      query.cuisineIds?.length
        ? Prisma.sql`AND EXISTS (
            SELECT 1 FROM restaurant_cuisines rc
            WHERE rc.restaurant_id = r.id
              AND rc.cuisine_id IN (${Prisma.join(query.cuisineIds)})
          )`
        : Prisma.empty;

    const dietaryFilter =
      query.dietaryTagIds?.length
        ? Prisma.sql`AND EXISTS (
            SELECT 1 FROM menu_categories mc
            JOIN dishes d ON d.category_id = mc.id
            JOIN dish_dietary_tags ddt ON ddt.dish_id = d.id
            WHERE mc.restaurant_id = r.id
              AND ddt.tag_id IN (${Prisma.join(query.dietaryTagIds)})
          )`
        : Prisma.empty;

    const priceFilter =
      query.maxPrice !== undefined
        ? Prisma.sql`AND EXISTS (
            SELECT 1 FROM menu_categories mc
            JOIN dishes d ON d.category_id = mc.id
            WHERE mc.restaurant_id = r.id
              AND d.is_available = TRUE
              AND d.price <= ${query.maxPrice}
          )`
        : Prisma.empty;

    const searchFilter = query.q
      ? Prisma.sql`AND (
          r.name ILIKE ${'%' + query.q + '%'}
          OR r.description ILIKE ${'%' + query.q + '%'}
          OR EXISTS (
            SELECT 1 FROM menu_categories mc
            JOIN dishes d ON d.category_id = mc.id
            WHERE mc.restaurant_id = r.id AND d.name ILIKE ${'%' + query.q + '%'}
          )
        )`
      : Prisma.empty;

    const rows = await this.prisma.$queryRaw<NearbyRow[]>`
      SELECT
        r.id,
        r.name,
        r.description,
        r.rating,
        r.review_count,
        r.status,
        l.address_line,
        l.neighborhood,
        l.city,
        l.latitude,
        l.longitude,
        (
          6371000 * acos(
            LEAST(1, GREATEST(-1,
              cos(radians(${query.lat})) * cos(radians(l.latitude::double precision))
              * cos(radians(l.longitude::double precision) - radians(${query.lng}))
              + sin(radians(${query.lat})) * sin(radians(l.latitude::double precision))
            ))
          )
        ) AS distance_meters,
        (
          SELECT d.image_url
          FROM menu_categories mc
          JOIN dishes d ON d.category_id = mc.id
          WHERE mc.restaurant_id = r.id AND d.image_url IS NOT NULL
          ORDER BY d.created_at
          LIMIT 1
        ) AS cover_image_url,
        (
          SELECT MIN(d.price)
          FROM menu_categories mc
          JOIN dishes d ON d.category_id = mc.id
          WHERE mc.restaurant_id = r.id AND d.is_available = TRUE
        ) AS min_price
      FROM restaurants r
      JOIN locations l ON l.restaurant_id = r.id
      WHERE r.status = 'active'
        ${cuisineFilter}
        ${dietaryFilter}
        ${priceFilter}
        ${searchFilter}
        AND (
          6371000 * acos(
            LEAST(1, GREATEST(-1,
              cos(radians(${query.lat})) * cos(radians(l.latitude::double precision))
              * cos(radians(l.longitude::double precision) - radians(${query.lng}))
              + sin(radians(${query.lat})) * sin(radians(l.latitude::double precision))
            ))
          )
        ) <= ${radius}
      ORDER BY distance_meters ASC
      LIMIT ${limit}
    `;

    const ids = rows.map((r) => r.id);
    const [hours, cuisines] = await Promise.all([
      this.prisma.businessHour.findMany({
        where: { restaurantId: { in: ids } },
        orderBy: { dayOfWeek: 'asc' },
      }),
      this.prisma.restaurantCuisine.findMany({
        where: { restaurantId: { in: ids } },
        include: { cuisine: true },
      }),
    ]);

    const hoursByRestaurant = new Map<string, typeof hours>();
    for (const hour of hours) {
      const list = hoursByRestaurant.get(hour.restaurantId) ?? [];
      list.push(hour);
      hoursByRestaurant.set(hour.restaurantId, list);
    }

    const cuisinesByRestaurant = new Map<string, { id: number; name: string }[]>();
    for (const row of cuisines) {
      const list = cuisinesByRestaurant.get(row.restaurantId) ?? [];
      list.push({ id: row.cuisine.id, name: row.cuisine.name });
      cuisinesByRestaurant.set(row.restaurantId, list);
    }

    const pins = rows
      .map((row) => {
        const restaurantHours = hoursByRestaurant.get(row.id) ?? [];
        const open = isOpenNow(restaurantHours, dayOfWeek, time);
        return {
          id: row.id,
          name: row.name,
          description: row.description,
          rating: toNumber(row.rating),
          reviewCount: row.review_count,
          coverImageUrl: row.cover_image_url,
          minPrice: toNumber(row.min_price),
          distanceMeters: Math.round(Number(row.distance_meters)),
          isOpen: open,
          location: {
            addressLine: row.address_line,
            neighborhood: row.neighborhood,
            city: row.city,
            latitude: toNumber(row.latitude),
            longitude: toNumber(row.longitude),
          },
          cuisines: cuisinesByRestaurant.get(row.id) ?? [],
          hoursToday: restaurantHours
            .filter((h) => h.dayOfWeek === dayOfWeek)
            .map((h) => ({
              openTime: timeToHhMm(h.openTime),
              closeTime: timeToHhMm(h.closeTime),
              isClosed: h.isClosed,
            }))[0] ?? null,
        };
      })
      .filter((pin) => (query.openNow ? pin.isOpen : true));

    return {
      count: pins.length,
      radiusMeters: radius,
      pins,
    };
  }
}
