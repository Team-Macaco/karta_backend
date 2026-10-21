# Karta API - Colección de Pruebas en Bruno

Esta carpeta contiene la colección completa de endpoints del backend de **Karta** para el cliente de APIs **Bruno** (y compatible con importación Postman).

---

## 🚀 Cómo abrir la colección en Bruno

1. Abre la aplicación **Bruno**.
2. Haz clic en **"Open Collection"**.
3. Selecciona la carpeta `bruno` de este repositorio (`backend_karta/bruno`).
4. En la esquina superior derecha de Bruno, selecciona el entorno **`local`**.
5. ¡Listo! Todas las carpetas y peticiones estarán cargadas.

*(Opcional: Si prefieres importar un único archivo, puedes usar `Import Collection > Postman Collection` y seleccionar `karta-api.postman_collection.json`).*

---

## ⚙️ Variables de Entorno (`environments/local.bru`)

El entorno `local` incluye por defecto:

| Variable | Valor por defecto | Descripción |
|---|---|---|
| `baseUrl` | `http://localhost:3000/api` | URL base del backend NestJS |
| `token` | `""` | Se actualiza automáticamente al hacer Login |
| `restaurantId` | `11111111-1111-1111-1111-111111111111` | ID del restaurante demo (*Tacos & Co.*) |
| `dishId` | `33333333-3333-3333-3333-333333333333` | ID del platillo demo (*Taco al pastor*) |
| `categoryId` | `1` | ID de la categoría demo (*Tacos*) |

---

## 👥 Usuarios de Prueba (Pre-configurados con Seed)

| Rol | Email | Password | Permisos |
|---|---|---|---|
| **Explorer** | `ava@karta.app` | `karta1234` | Ver restaurantes, menú, favoritos y eventos |
| **Owner** | `owner@karta.app` | `karta1234` | Crear/editar restaurantes propios, menús, platillos |
| **Admin** | `admin@karta.app` | `karta1234` | Todo lo anterior + cambiar estado a `active`/`suspended` |

> 💡 **Tip:** Al ejecutar cualquiera de las peticiones de `Login` (`Owner`, `Explorer` o `Admin`), un script de post-respuesta almacena de forma automática el `accessToken` en la variable `token`.

---

## 📂 Estructura de Endpoints por Módulo

### 1. `01-Health`
* `GET /api/health` - Estado del servicio.

### 2. `02-Auth`
* `POST /api/auth/register` - Registro de nuevos usuarios.
* `POST /api/auth/login` (Owner) - Iniciar sesión como Dueño.
* `POST /api/auth/login` (Explorer) - Iniciar sesión como Explorador.
* `POST /api/auth/login` (Admin) - Iniciar sesión como Administrador.
* `GET /api/auth/me` - Perfil del usuario autenticado actual.

### 3. `03-Catalogs`
* `GET /api/cuisines` - Listado de tipos de cocina (Tacos, Hamburguesas, etc.).
* `GET /api/dietary-tags` - Listado de etiquetas dietéticas (Vegano, Sin Gluten, etc.).

### 4. `04-Map`
* `GET /api/map/nearby` - Búsqueda geoespacial por radio (`lat`, `lng`, `radius`, `q`, filtros de cocina, precio, etc.).

### 5. `05-Restaurants`
* `POST /api/restaurants` - Crear restaurante (Owner/Admin).
* `GET /api/restaurants/mine` - Listar restaurantes del dueño autenticado.
* `GET /api/restaurants/:id` - Detalle público de un restaurante.
* `PATCH /api/restaurants/:id` - Actualizar información del restaurante.
* `POST /api/restaurants/:id/submit` - Enviar restaurante a revisión (`pending_review`).
* `PATCH /api/restaurants/:id/status` - Cambiar estado del restaurante (Solo Admin).
* `PUT /api/restaurants/:id/location` - Configurar/actualizar ubicación y coordenadas.
* `PUT /api/restaurants/:id/hours` - Configurar/actualizar horarios por día de la semana.
* `DELETE /api/restaurants/:id` - Eliminar restaurante.

### 6. `06-Menus`
* `GET /api/restaurants/:id/menu` - Obtener menú completo de un restaurante.
* `POST /api/restaurants/:id/categories` - Crear categoría de menú (ej. Bebidas).
* `PATCH /api/menu-categories/:id` - Actualizar categoría de menú.
* `DELETE /api/menu-categories/:id` - Eliminar categoría de menú.
* `POST /api/menu-categories/:id/dishes` - Crear platillo dentro de una categoría.
* `PATCH /api/dishes/:id` - Actualizar platillo.
* `DELETE /api/dishes/:id` - Eliminar platillo.

### 7. `07-Favorites`
* `GET /api/me/favorites/places` - Listar restaurantes guardados en favoritos.
* `POST /api/me/favorites/places/:restaurantId` - Guardar restaurante en favoritos.
* `DELETE /api/me/favorites/places/:restaurantId` - Quitar restaurante de favoritos.
* `GET /api/me/favorites/dishes` - Listar platillos guardados en favoritos.
* `POST /api/me/favorites/dishes/:dishId` - Guardar platillo en favoritos.
* `DELETE /api/me/favorites/dishes/:dishId` - Quitar platillo de favoritos.

### 8. `08-Analytics`
* `POST /api/analytics/events` - Registrar evento de analítica (`view_menu`, `view_pin`, `click_navigation`, `save`).
* `GET /api/restaurants/:id/analytics` - Resumen y métricas del restaurante (Owner/Admin).
