import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

// Entities
import { WeatherEntity } from '../entities/weather.entity';
import { SearchHistoryEntity } from '../entities/search-history.entity';
import { CityEntity } from '../entities/city.entity';
import { ForecastEntity } from '../entities/forecast.entity';

// DTOs
import {
  WeatherResponseDto,
  SearchHistoryResponseDto,
  ForecastResponseDto,
  CityResponseDto,
} from '../dto/weather-response.dto';

// OpenWeatherMap API interfaces
interface OpenWeatherMapCurrentResponse {
  coord: { lat: number; lon: number };
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
  };
  weather: Array<{
    main: string;
    description: string;
    icon: string;
  }>;
  wind: {
    speed: number;
    deg: number;
  };
  sys: {
    country: string;
    sunrise: number;
    sunset: number;
  };
  name: string;
}

interface OpenWeatherMapForecastResponse {
  city: {
    name: string;
    country: string;
    coord: { lat: number; lon: number };
  };
  list: Array<{
    dt: number;
    main: {
      temp: number;
      humidity: number;
      pressure: number;
    };
    weather: Array<{
      main: string;
      description: string;
      icon: string;
    }>;
    wind: {
      speed: number;
      deg: number;
    };
    rain?: { '3h': number };
    pop?: number;
  }>;
}

@Injectable()
export class EnhancedWeatherService {
  private readonly logger = new Logger(EnhancedWeatherService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.openweathermap.org/data/2.5';

  constructor(
    @InjectRepository(WeatherEntity)
    private weatherRepository: Repository<WeatherEntity>,
    @InjectRepository(SearchHistoryEntity)
    private searchHistoryRepository: Repository<SearchHistoryEntity>,
    @InjectRepository(CityEntity)
    private cityRepository: Repository<CityEntity>,
    @InjectRepository(ForecastEntity)
    private forecastRepository: Repository<ForecastEntity>,
    private configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>('OPENWEATHER_API_KEY') || '';
    if (!this.apiKey || this.apiKey === 'your_api_key_here') {
      this.logger.warn('OpenWeatherMap API key not configured properly');
    }
  }

  // Get current weather with enhanced city tracking
  async getCurrentWeather(cityName: string): Promise<WeatherResponseDto> {
    try {
      // Find or create city record
      let city = await this.findOrCreateCity(cityName);

      // Check if we have fresh cached data (less than 15 minutes old)
      const cachedWeather = await this.getCachedWeather(city.id);
      if (cachedWeather) {
        this.logger.log(`Returning cached weather data for ${cityName}`);
        await this.updateCitySearchCount(city.id);
        return this.mapWeatherToResponseDto(cachedWeather, city);
      }

      // Fetch fresh data from API
      this.logger.log(`Fetching fresh weather data for ${cityName}`);
      const weatherData = await this.fetchCurrentWeatherFromAPI(cityName);

      // Update city with API data
      city = await this.updateCityFromAPI(city, weatherData);

      // Save weather data
      const savedWeather = await this.saveCurrentWeatherData(weatherData, city);

      // Update search count
      await this.updateCitySearchCount(city.id);

      return this.mapWeatherToResponseDto(savedWeather, city);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Error fetching weather for ${cityName}:`,
        errorMessage,
      );

      // Try to return stale cached data if API fails
      const city = await this.cityRepository.findOne({
        where: { name: cityName.toLowerCase() },
      });

      if (city) {
        const staleData = await this.getStaleWeatherData(city.id);
        if (staleData) {
          this.logger.warn(`Returning stale cached data for ${cityName}`);
          return this.mapWeatherToResponseDto(staleData, city);
        }
      }

      throw new NotFoundException(
        `Weather data not found for city: ${cityName}`,
      );
    }
  }

  // Get forecast data
  async getForecast(cityName: string): Promise<ForecastResponseDto> {
    try {
      let city = await this.findOrCreateCity(cityName);

      // Check if we have fresh forecast data (less than 1 hour old)
      const cachedForecasts = await this.getCachedForecasts(city.id);
      if (cachedForecasts.length > 0) {
        this.logger.log(`Returning cached forecast data for ${cityName}`);
        await this.updateCitySearchCount(city.id);
        return this.mapForecastToResponseDto(city, cachedForecasts);
      }

      // Fetch fresh forecast data from API
      this.logger.log(`Fetching fresh forecast data for ${cityName}`);
      const forecastData = await this.fetchForecastFromAPI(cityName);

      // Update city with API data
      city = await this.updateCityFromForecastAPI(city, forecastData);

      // Save forecast data
      const savedForecasts = await this.saveForecastData(forecastData, city);

      // Update search count
      await this.updateCitySearchCount(city.id);

      return this.mapForecastToResponseDto(city, savedForecasts);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Error fetching forecast for ${cityName}:`,
        errorMessage,
      );

      // Try to return stale cached data
      const city = await this.cityRepository.findOne({
        where: { name: cityName.toLowerCase() },
      });

      if (city) {
        const staleForecasts = await this.getStaleForecasts(city.id);
        if (staleForecasts.length > 0) {
          this.logger.warn(`Returning stale forecast data for ${cityName}`);
          return this.mapForecastToResponseDto(city, staleForecasts);
        }
      }

      throw new NotFoundException(
        `Forecast data not found for city: ${cityName}`,
      );
    }
  }

  // Get search history
  async getSearchHistory(): Promise<SearchHistoryResponseDto[]> {
    const cities = await this.cityRepository.find({
      where: { searchCount: 1 }, // Cities that have been searched
      order: { lastSearched: 'DESC' },
      take: 10,
    });

    return cities.map((city) => ({
      cityName: city.name,
      searchCount: city.searchCount,
      lastSearched: city.lastSearched,
    }));
  }

  // Get all cities
  async getCities(): Promise<CityResponseDto[]> {
    const cities = await this.cityRepository.find({
      order: { searchCount: 'DESC' },
    });

    return cities.map((city) => ({
      id: city.id,
      name: city.name,
      country: city.country,
      latitude: city.latitude,
      longitude: city.longitude,
      searchCount: city.searchCount,
      lastSearched: city.lastSearched,
    }));
  }

  // Scheduled task to refresh popular cities every hour
  @Cron(CronExpression.EVERY_HOUR)
  async refreshPopularCities() {
    this.logger.log('Starting scheduled refresh of popular cities');

    try {
      const popularCities = await this.cityRepository.find({
        where: { searchCount: 3 }, // Cities searched 3+ times
        order: { searchCount: 'DESC' },
        take: 10,
      });

      // Process cities in batches to avoid overwhelming the API
      const batchSize = 3;
      for (let i = 0; i < popularCities.length; i += batchSize) {
        const batch = popularCities.slice(i, i + batchSize);

        await Promise.allSettled(
          batch.map(async (city) => {
            try {
              // Fetch and save current weather data
              const weatherApiData = await this.fetchCurrentWeatherFromAPI(
                city.name,
              );
              const updatedCity = await this.updateCityFromAPI(
                city,
                weatherApiData,
              );
              await this.saveCurrentWeatherData(weatherApiData, updatedCity);

              // Fetch and save forecast data
              const forecastApiData = await this.fetchForecastFromAPI(
                city.name,
              );
              await this.saveForecastData(forecastApiData, updatedCity);
              this.logger.log(`Refreshed data for ${city.name}`);
            } catch (error: unknown) {
              const errorMessage =
                error instanceof Error ? error.message : 'Unknown error';
              this.logger.error(
                `Failed to refresh ${city.name}: ${errorMessage}`,
              );
            }
          }),
        );

        // Small delay between batches to be respectful to API limits
        if (i + batchSize < popularCities.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      this.logger.log('Completed scheduled refresh of popular cities');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Error in scheduled refresh:', errorMessage);
    }
  }

  // Private helper methods
  private async findOrCreateCity(cityName: string): Promise<CityEntity> {
    let city = await this.cityRepository.findOne({
      where: { name: cityName.toLowerCase() },
    });

    if (!city) {
      city = new CityEntity();
      city.name = cityName.toLowerCase();
      city.country = '';
      city.latitude = 0;
      city.longitude = 0;
      city.searchCount = 0;
      city = await this.cityRepository.save(city);
    }

    return city;
  }

  private async getCachedWeather(
    cityId: number,
  ): Promise<WeatherEntity | null> {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    const weather = await this.weatherRepository.findOne({
      where: { cityId },
    });

    if (weather && weather.updatedAt > fifteenMinutesAgo) {
      return weather;
    }
    return null;
  }

  private async getStaleWeatherData(
    cityId: number,
  ): Promise<WeatherEntity | null> {
    return this.weatherRepository.findOne({
      where: { cityId },
    });
  }

  private async getCachedForecasts(cityId: number): Promise<ForecastEntity[]> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    return this.forecastRepository
      .find({
        where: { cityId },
        order: { forecastDate: 'ASC' },
      })
      .then((forecasts) => {
        // Return if any forecast is fresh
        if (forecasts.length > 0 && forecasts[0].updatedAt > oneHourAgo) {
          return forecasts;
        }
        return [];
      });
  }

  private async getStaleForecasts(cityId: number): Promise<ForecastEntity[]> {
    return this.forecastRepository.find({
      where: { cityId },
      order: { forecastDate: 'ASC' },
    });
  }

  private async fetchCurrentWeatherFromAPI(
    cityName: string,
  ): Promise<OpenWeatherMapCurrentResponse> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/weather?q=${encodeURIComponent(cityName)}&appid=${this.apiKey}&units=metric`,
      );
      return response.data as OpenWeatherMapCurrentResponse;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new NotFoundException(`City "${cityName}" not found`);
        }
        if (error.response?.status === 401) {
          throw new BadRequestException('Weather API key is invalid');
        }
      }
      throw error;
    }
  }

  private async fetchForecastFromAPI(
    cityName: string,
  ): Promise<OpenWeatherMapForecastResponse> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/forecast?q=${encodeURIComponent(cityName)}&appid=${this.apiKey}&units=metric`,
      );
      return response.data as OpenWeatherMapForecastResponse;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new NotFoundException(`City "${cityName}" not found`);
        }
        if (error.response?.status === 401) {
          throw new BadRequestException('Weather API key is invalid');
        }
      }
      throw error;
    }
  }

  private async updateCityFromAPI(
    city: CityEntity,
    apiData: OpenWeatherMapCurrentResponse,
  ): Promise<CityEntity> {
    city.name = apiData.name.toLowerCase();
    city.country = apiData.sys.country;
    city.latitude = apiData.coord.lat;
    city.longitude = apiData.coord.lon;
    return this.cityRepository.save(city);
  }

  private async updateCityFromForecastAPI(
    city: CityEntity,
    apiData: OpenWeatherMapForecastResponse,
  ): Promise<CityEntity> {
    city.name = apiData.city.name.toLowerCase();
    city.country = apiData.city.country;
    city.latitude = apiData.city.coord.lat;
    city.longitude = apiData.city.coord.lon;
    return this.cityRepository.save(city);
  }

  private async saveCurrentWeatherData(
    apiData: OpenWeatherMapCurrentResponse,
    city: CityEntity,
  ): Promise<WeatherEntity> {
    let weather = await this.weatherRepository.findOne({
      where: { cityId: city.id },
    });

    if (!weather) {
      weather = new WeatherEntity();
      weather.cityId = city.id;
    }

    weather.cityName = apiData.name.toLowerCase();
    weather.temperature = apiData.main.temp;
    weather.feelsLike = apiData.main.feels_like;
    weather.humidity = apiData.main.humidity;
    weather.windSpeed = apiData.wind.speed;
    weather.weatherCondition = apiData.weather[0].main;
    weather.pressure = apiData.main.pressure;
    weather.sunrise = new Date(apiData.sys.sunrise * 1000);
    weather.sunset = new Date(apiData.sys.sunset * 1000);
    weather.description = apiData.weather[0].description;
    weather.icon = apiData.weather[0].icon;

    return this.weatherRepository.save(weather);
  }

  private async saveForecastData(
    apiData: OpenWeatherMapForecastResponse,
    city: CityEntity,
  ): Promise<ForecastEntity[]> {
    // Delete existing forecasts for this city
    await this.forecastRepository.delete({ cityId: city.id });

    const forecasts: ForecastEntity[] = [];

    for (const item of apiData.list) {
      const forecast = new ForecastEntity();
      forecast.cityId = city.id;
      forecast.forecastDate = new Date(item.dt * 1000);
      forecast.temperature = item.main.temp;
      forecast.humidity = item.main.humidity;
      forecast.windSpeed = item.wind.speed;
      forecast.windDirection = item.wind.deg;
      forecast.pressure = item.main.pressure;
      forecast.weatherMain = item.weather[0].main;
      forecast.weatherDescription = item.weather[0].description;
      forecast.rainVolume = item.rain?.['3h'] || 0;
      forecast.probability = item.pop ? item.pop * 100 : 0;
      forecast.icon = item.weather[0].icon;

      forecasts.push(forecast);
    }

    return this.forecastRepository.save(forecasts);
  }

  private async updateCitySearchCount(cityId: number): Promise<void> {
    await this.cityRepository.increment({ id: cityId }, 'searchCount', 1);
    await this.cityRepository.update(cityId, { lastSearched: new Date() });
  }

  private mapWeatherToResponseDto(
    weather: WeatherEntity,
    city: CityEntity,
  ): WeatherResponseDto {
    return {
      cityName: city.name,
      country: city.country,
      temperature: weather.temperature,
      feelsLike: weather.feelsLike,
      humidity: weather.humidity,
      windSpeed: weather.windSpeed,
      windDirection: 0, // Add this to WeatherEntity if needed
      weatherCondition: weather.weatherCondition,
      pressure: weather.pressure,
      sunrise: weather.sunrise,
      sunset: weather.sunset,
      description: weather.description,
      icon: weather.icon,
      latitude: city.latitude,
      longitude: city.longitude,
      lastUpdated: weather.updatedAt,
    };
  }

  private mapForecastToResponseDto(
    city: CityEntity,
    forecasts: ForecastEntity[],
  ): ForecastResponseDto {
    return {
      cityName: city.name,
      country: city.country,
      forecasts: forecasts.map((forecast) => ({
        forecastDate: forecast.forecastDate,
        temperature: forecast.temperature,
        humidity: forecast.humidity,
        windSpeed: forecast.windSpeed,
        windDirection: forecast.windDirection,
        pressure: forecast.pressure,
        weatherMain: forecast.weatherMain,
        weatherDescription: forecast.weatherDescription,
        rainVolume: forecast.rainVolume,
        probability: forecast.probability,
        icon: forecast.icon,
      })),
    };
  }
}
