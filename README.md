# Karta API

Backend de **Karta**, la app para decidir qué comer según antojo, presupuesto y distancia. Está pensado para el cliente en React Native: mapa de solo comida, ficha del local, menú digital, favoritos y panel B2B para dueños.

Stack: **NestJS**, **Prisma**, **PostgreSQL (Supabase)** y **JWT**.

## Qué cubre este backend

- Registro / login (explorer, owner, admin) y modo invitado en endpoints públicos
- Mapa cercano con radio, cocina, dieta, presupuesto y “abierto ahora”
- Ficha y menú del restaurante
- CRUD B2B: restaurante, ubicación, horarios, categorías y platillos
- Favoritos de lugares y platillos
- Eventos de analítica (`view_menu`, `click_navigation`, `save`, `view_pin`)

## Arranque con Supabase

1. Crea un proyecto en [Supabase](https://supabase.com) y copia el **URI** de Postgres (`Project Settings > Database`).
2. Copia las variables de entorno:

```bash
copy .env.example .env
```

3. Pega `DATABASE_URL` y un `JWT_SECRET` largo.
4. Instala dependencias y crea las tablas:

```bash
npm install
npx prisma generate
npx prisma db push
npx prisma db seed
npm run start:dev
```

- API: `http://localhost:3000/api`
- Health: `http://localhost:3000/api/health`
- Swagger: `http://localhost:3000/docs`
- Colección Bruno: Carpeta `bruno/` (o importar `bruno/karta-api.postman_collection.json`)

Usuarios de prueba (seed):

| Rol | Email | Password |
| --- | --- | --- |
| Explorer | ava@karta.app | karta1234 |
| Owner | owner@karta.app | karta1234 |
| Admin | admin@karta.app | karta1234 |

Hay dos restaurantes demo en Roma Norte / Condesa (CDMX) para probar el mapa:

`GET /api/map/nearby?lat=19.4194&lng=-99.1624&radius=1500`

## Auth desde React Native

```http
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
Authorization: Bearer <accessToken>
```

El mapa, catálogos, ficha y menú son públicos (sirven para “continuar como invitado”). Favoritos y panel del dueño requieren JWT.

## Endpoints principales

| Uso en la app | Endpoint |
| --- | --- |
| Filtros | `GET /api/cuisines` `GET /api/dietary-tags` |
| Pines del mapa | `GET /api/map/nearby?lat=&lng=&radius=&cuisineIds=&dietaryTagIds=&maxPrice=&openNow=&q=` |
| Ficha | `GET /api/restaurants/:id` |
| Menú | `GET /api/restaurants/:id/menu` |
| Favoritos | `GET/POST/DELETE /api/me/favorites/places/:restaurantId` |
| Analítica | `POST /api/analytics/events` |
| Dueño | `POST /api/restaurants` + `PUT .../location` + `PUT .../hours` |
| Publicar | `POST /api/restaurants/:id/submit` (admin activa con `PATCH .../status`) |

El mapa solo muestra restaurantes con `status = active` y ubicación cargada. El dueño crea en `draft`, envía a revisión y un admin lo deja `active`.

## Notas de producto vs SQL original

El schema de Prisma replica `karta.sql`. Lo que el PDF pide y **aún no está en la base** (promos, descuentos por check-in, redes sociales, presupuesto persistido del usuario) se puede agregar en una siguiente iteración sin romper el cliente.

La distancia se calcula con Haversine sobre `latitude` / `longitude`. PostGIS se puede activar después en Supabase si el volumen lo pide.
