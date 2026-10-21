import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const CUISINES = [
  'Tacos',
  'Hamburguesas',
  'Italiana',
  'Japonesa/Sushi',
  'Mexicana',
  'Vegana',
  'Mariscos',
  'Cafetería',
];

const DIETARY_TAGS = ['Vegetariano', 'Vegano', 'Sin Gluten', 'Halal', 'Keto'];

async function main() {
  await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  for (const name of CUISINES) {
    await prisma.cuisine.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  for (const name of DIETARY_TAGS) {
    await prisma.dietaryTag.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const passwordHash = await bcrypt.hash('karta1234', 10);

  const explorer = await prisma.user.upsert({
    where: { email: 'ava@karta.app' },
    update: {},
    create: {
      fullName: 'Ava Morales',
      email: 'ava@karta.app',
      passwordHash,
      role: 'explorer',
    },
  });

  const owner = await prisma.user.upsert({
    where: { email: 'owner@karta.app' },
    update: {},
    create: {
      fullName: 'Dueño Demo',
      email: 'owner@karta.app',
      passwordHash,
      role: 'owner',
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@karta.app' },
    update: {},
    create: {
      fullName: 'Admin Karta',
      email: 'admin@karta.app',
      passwordHash,
      role: 'admin',
    },
  });

  const tacosCuisine = await prisma.cuisine.findUniqueOrThrow({ where: { name: 'Tacos' } });
  const mexicana = await prisma.cuisine.findUniqueOrThrow({ where: { name: 'Mexicana' } });
  const vegana = await prisma.cuisine.findUniqueOrThrow({ where: { name: 'Vegana' } });
  const cafe = await prisma.cuisine.findUniqueOrThrow({ where: { name: 'Cafetería' } });
  const veganoTag = await prisma.dietaryTag.findUniqueOrThrow({ where: { name: 'Vegano' } });
  const vegetariano = await prisma.dietaryTag.findUniqueOrThrow({
    where: { name: 'Vegetariano' },
  });

  const tacosCo = await prisma.restaurant.upsert({
    where: { id: '11111111-1111-1111-1111-111111111111' },
    update: {},
    create: {
      id: '11111111-1111-1111-1111-111111111111',
      ownerId: owner.id,
      name: 'Tacos & Co.',
      description: 'Tacos de pastor, suadero y opciones veganas en Roma Norte.',
      phone: '5511111111',
      email: 'hola@tacosco.mx',
      rating: 4.8,
      reviewCount: 120,
      status: 'active',
      cuisines: {
        create: [{ cuisineId: tacosCuisine.id }, { cuisineId: mexicana.id }],
      },
      location: {
        create: {
          addressLine: 'Av. Álvaro Obregón 168',
          neighborhood: 'Roma Norte',
          zipCode: '06700',
          city: 'Ciudad de México',
          state: 'CDMX',
          latitude: 19.4194,
          longitude: -99.1624,
        },
      },
    },
  });

  const greenFork = await prisma.restaurant.upsert({
    where: { id: '22222222-2222-2222-2222-222222222222' },
    update: {},
    create: {
      id: '22222222-2222-2222-2222-222222222222',
      ownerId: owner.id,
      name: 'Green Fork',
      description: 'Comida vegana y bowls cerca de Condesa.',
      phone: '5522222222',
      rating: 4.6,
      reviewCount: 64,
      status: 'active',
      cuisines: {
        create: [{ cuisineId: vegana.id }, { cuisineId: cafe.id }],
      },
      location: {
        create: {
          addressLine: 'Amsterdam 45',
          neighborhood: 'Condesa',
          zipCode: '06100',
          city: 'Ciudad de México',
          state: 'CDMX',
          latitude: 19.4118,
          longitude: -99.1712,
        },
      },
    },
  });

  await seedHours(tacosCo.id, '09:00', '23:00');
  await seedHours(greenFork.id, '08:00', '21:00');

  const tacosCategory = await prisma.menuCategory.upsert({
    where: { id: 1 },
    update: {},
    create: { restaurantId: tacosCo.id, name: 'Tacos', displayOrder: 0 },
  });

  const bowlsCategory = await prisma.menuCategory.upsert({
    where: { id: 2 },
    update: {},
    create: { restaurantId: greenFork.id, name: 'Bowls', displayOrder: 0 },
  });

  const pastor = await prisma.dish.upsert({
    where: { id: '33333333-3333-3333-3333-333333333333' },
    update: {},
    create: {
      id: '33333333-3333-3333-3333-333333333333',
      categoryId: tacosCategory.id,
      name: 'Taco al pastor',
      description: 'Trompo, piña y cilantro.',
      price: 28,
      imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47',
    },
  });

  const setas = await prisma.dish.upsert({
    where: { id: '44444444-4444-4444-4444-444444444444' },
    update: {},
    create: {
      id: '44444444-4444-4444-4444-444444444444',
      categoryId: tacosCategory.id,
      name: 'Taco de setas',
      description: 'Setas al ajillo, opción vegana.',
      price: 32,
      imageUrl: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b',
      dietaryTags: { create: [{ tagId: veganoTag.id }, { tagId: vegetariano.id }] },
    },
  });

  await prisma.dish.upsert({
    where: { id: '55555555-5555-5555-5555-555555555555' },
    update: {},
    create: {
      id: '55555555-5555-5555-5555-555555555555',
      categoryId: bowlsCategory.id,
      name: 'Bowl de quinoa',
      description: 'Quinoa, kale, hummus y aderezo de tahini.',
      price: 129,
      imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd',
      dietaryTags: { create: [{ tagId: veganoTag.id }] },
    },
  });

  console.log('Seed listo');
  console.log({
    explorer: explorer.email,
    owner: owner.email,
    admin: admin.email,
    password: 'karta1234',
    restaurants: [tacosCo.name, greenFork.name],
    dishes: [pastor.name, setas.name],
  });
}

async function seedHours(restaurantId: string, openTime: string, closeTime: string) {
  const count = await prisma.businessHour.count({ where: { restaurantId } });
  if (count > 0) return;

  const [oh, om] = openTime.split(':').map(Number);
  const [ch, cm] = closeTime.split(':').map(Number);

  await prisma.businessHour.createMany({
    data: Array.from({ length: 7 }).map((_, dayOfWeek) => ({
      restaurantId,
      dayOfWeek,
      openTime: new Date(Date.UTC(1970, 0, 1, oh, om)),
      closeTime: new Date(Date.UTC(1970, 0, 1, ch, cm)),
      isClosed: dayOfWeek === 0,
    })),
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
