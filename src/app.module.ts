import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CatalogsModule } from './catalogs/catalogs.module';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { MenusModule } from './menus/menus.module';
import { MapModule } from './map/map.module';
import { FavoritesModule } from './favorites/favorites.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    CatalogsModule,
    RestaurantsModule,
    MenusModule,
    MapModule,
    FavoritesModule,
    AnalyticsModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
