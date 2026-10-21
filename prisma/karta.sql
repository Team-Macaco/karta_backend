-- ==========================================================
-- SCRIPT DE BASE DE DATOS: KARTA APP
-- Motor: PostgreSQL
-- ==========================================================

-- 0. Habilitar extensión para UUIDs (si no está activa)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================================
-- 1. TABLAS DE CATÁLOGOS (PRE-CONFIGURADOS)
-- ==========================================================

CREATE TABLE cuisines (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE, -- Ej: 'Mexicana', 'Italiana', 'Sushi'
    icon_url TEXT
);

CREATE TABLE dietary_tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE -- Ej: 'Vegano', 'Sin Gluten', 'Vegetariano'
);

-- ==========================================================
-- 2. IDENTIDAD Y USUARIOS
-- ==========================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'explorer' CHECK (role IN ('explorer', 'owner', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================================
-- 3. MÓDULO B2B (NEGOCIOS)
-- ==========================================================

CREATE TABLE restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    phone VARCHAR(20),
    email VARCHAR(150),
    rating DECIMAL(2,1) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
    review_count INTEGER DEFAULT 0,
    -- Estatus B2B
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'active', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ubicación física del restaurante
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    address_line TEXT NOT NULL,
    neighborhood VARCHAR(100),
    zip_code VARCHAR(10),
    city VARCHAR(100),
    state VARCHAR(100),
    -- Coordenadas para el mapa
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    UNIQUE(restaurant_id) -- Un restaurante, una ubicación principal
);

-- Horarios de operación
CREATE TABLE business_hours (
    id SERIAL PRIMARY KEY,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Domingo, 1=Lunes...
    open_time TIME NOT NULL,
    close_time TIME NOT NULL,
    is_closed BOOLEAN DEFAULT FALSE,
    UNIQUE(restaurant_id, day_of_week)
);

-- ==========================================================
-- 4. MÓDULO DE MENÚ (LA CARTA)
-- ==========================================================

-- Categorías del menú (Ej: 'Entradas', 'Platos Fuertes')
CREATE TABLE menu_categories (
    id SERIAL PRIMARY KEY,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    display_order INTEGER DEFAULT 0
);

-- Platillos individuales
CREATE TABLE dishes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id INTEGER REFERENCES menu_categories(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(5) DEFAULT 'MXN',
    image_url TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================================
-- 5. RELACIONES MUCHOS A MUCHOS (M:N)
-- ==========================================================

-- Relación Restaurante <-> Tipos de Cocina
CREATE TABLE restaurant_cuisines (
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    cuisine_id INTEGER REFERENCES cuisines(id) ON DELETE CASCADE,
    PRIMARY KEY (restaurant_id, cuisine_id)
);

-- Relación Platillo <-> Etiquetas Dietéticas (Ej: Tacos de Setas es 'Vegano')
CREATE TABLE dish_dietary_tags (
    dish_id UUID REFERENCES dishes(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES dietary_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (dish_id, tag_id)
);

-- ==========================================================
-- 6. INTERACCIÓN Y ANALÍTICAS (B2C & B2B)
-- ==========================================================

-- Favoritos del usuario (Lugares)
CREATE TABLE user_favorites_places (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, restaurant_id)
);

-- Favoritos del usuario (Platillos específicos)
CREATE TABLE user_favorites_dishes (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    dish_id UUID REFERENCES dishes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, dish_id)
);

-- Analíticas para el dueño del negocio
CREATE TABLE analytics_events (
    id BIGSERIAL PRIMARY KEY,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Null si es invitado
    event_type VARCHAR(50) NOT NULL, -- 'view_menu', 'click_navigation', 'save'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================================
-- 7. DATOS SEED (CATÁLOGOS INICIALES)
-- ==========================================================

INSERT INTO cuisines (name) VALUES 
('Tacos'), ('Hamburguesas'), ('Italiana'), ('Japonesa/Sushi'), 
('Mexicana'), ('Vegana'), ('Mariscos'), ('Cafetería');

INSERT INTO dietary_tags (name) VALUES 
('Vegetariano'), ('Vegano'), ('Sin Gluten'), ('Halal'), ('Keto');
