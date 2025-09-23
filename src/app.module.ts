import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ScheduleModule } from '@nestjs/schedule';
import { join } from 'path';

// Import our entities
import { WeatherEntity } from './entities/weather.entity';
import { SearchHistoryEntity } from './entities/search-history.entity';
import { CityEntity } from './entities/city.entity';
import { ForecastEntity } from './entities/forecast.entity';

// Import our controllers
import { EnhancedWeatherController } from './controllers/enhanced-weather.controller';
import { DashboardController } from './controllers/dashboard.controller';

// Import our services
import { EnhancedWeatherService } from './services/enhanced-weather.service';

@Module({
  imports: [
    // Configuration module - handles environment variables
    ConfigModule.forRoot({
      isGlobal: true, // Makes config available everywhere
    }),

    // Scheduling module for background tasks
    ScheduleModule.forRoot(),

    // Database configuration
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'weather.db', // SQLite file in project root
      entities: [
        WeatherEntity,
        SearchHistoryEntity,
        CityEntity,
        ForecastEntity,
      ],
      synchronize: true, // Auto-create tables (don't use in production!)
      logging: false, // Set to true to see SQL queries
    }),

    // Register repositories for dependency injection
    TypeOrmModule.forFeature([
      WeatherEntity,
      SearchHistoryEntity,
      CityEntity,
      ForecastEntity,
    ]),

    // Serve static files from public/ directory
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/static',
    }),
  ],
  controllers: [EnhancedWeatherController, DashboardController],
  providers: [EnhancedWeatherService],
})
export class AppModule {}
