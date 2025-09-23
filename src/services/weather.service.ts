import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WeatherEntity } from '../entities/weather.entity';
import { SearchHistoryEntity } from '../entities/search-history.entity';
import {
  WeatherResponseDto,
  SearchHistoryResponseDto,
} from '../dto/weather-response.dto';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

// OpenWeatherMap API Response Interfaces
interface OpenWeatherMapResponse {
  name: string;
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
  };
  sys: {
    sunrise: number;
    sunset: number;
    country: string;
  };
  coord: {
    lat: number;
    lon: number;
  };
}

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.openweathermap.org/data/2.5';

  constructor(
    @InjectRepository(WeatherEntity)
    private weatherRepository: Repository<WeatherEntity>,
    @InjectRepository(SearchHistoryEntity)
    private searchHistoryRepository: Repository<SearchHistoryEntity>,
    private configService: ConfigService,
  ) {
    // Get API key from environment variables or use demo key
    this.apiKey =
      this.configService.get<string>('OPENWEATHER_API_KEY') || 'demo_key';
  }

  // Main method to get current weather
  async getCurrentWeather(cityName: string): Promise<WeatherResponseDto> {
    try {
      const cachedWeather = await this.getCachedWeather(cityName);
      if (cachedWeather) {
        this.logger.log(`Returning cached weather data for ${cityName}`);
        await this.updateSearchHistory(cityName);
        return this.mapToResponseDto(cachedWeather);
      }

      // Step 2: Fetch fresh data from OpenWeatherMap API
      this.logger.log(`Fetching fresh weather data for ${cityName}`);
      const weatherData = await this.fetchWeatherFromAPI(cityName);

      // Step 3: Save to database
      const savedWeather = await this.saveWeatherData(weatherData);

      // Step 4: Update search history
      await this.updateSearchHistory(cityName);

      return this.mapToResponseDto(savedWeather);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Error fetching weather for ${cityName}:`,
        errorMessage,
      );

      // Fallback: Try to return stale cached data if API fails
      const staleData = await this.getStaleWeatherData(cityName);
      if (staleData) {
        this.logger.warn(`Returning stale cached data for ${cityName}`);
        return this.mapToResponseDto(staleData);
      }

      throw new NotFoundException(
        `Weather data not found for city: ${cityName}`,
      );
    }
  }

  // Get list of recently searched cities
  async getSearchHistory(): Promise<SearchHistoryResponseDto[]> {
    const history = await this.searchHistoryRepository.find({
      order: { lastSearched: 'DESC' },
      take: 10, // Get last 10 searches
    });

    return history.map((item) => ({
      cityName: item.cityName,
      searchCount: item.searchCount,
      lastSearched: item.lastSearched,
    }));
  }

  // Check if we have fresh cached data (less than 2 hours old)
  private async getCachedWeather(
    cityName: string,
  ): Promise<WeatherEntity | null> {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    const weather = await this.weatherRepository.findOne({
      where: {
        cityName: cityName.toLowerCase(),
      },
      relations: ['city'],
    });

    // Return weather if it exists and is fresh (updated within 2 hours)
    if (weather && weather.updatedAt > twoHoursAgo) {
      return weather;
    }
    return null;
  }

  // Get any cached data, even if stale (for fallback when API fails)
  private async getStaleWeatherData(
    cityName: string,
  ): Promise<WeatherEntity | null> {
    return this.weatherRepository.findOne({
      where: {
        cityName: cityName.toLowerCase(),
      },
      relations: ['city'],
    });
  }

  // Fetch weather data from OpenWeatherMap API
  private async fetchWeatherFromAPI(
    cityName: string,
  ): Promise<OpenWeatherMapResponse> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/weather?q=${encodeURIComponent(cityName)}&appid=${this.apiKey}&units=metric`,
      );

      return response.data as OpenWeatherMapResponse;
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

  // Save weather data to database
  private async saveWeatherData(
    apiData: OpenWeatherMapResponse,
  ): Promise<WeatherEntity> {
    const weather = new WeatherEntity();
    weather.cityName = apiData.name.toLowerCase();
    weather.temperature = apiData.main.temp;
    weather.humidity = apiData.main.humidity;
    weather.windSpeed = apiData.wind.speed;
    weather.weatherCondition = apiData.weather[0].main;
    weather.pressure = apiData.main.pressure;
    weather.sunrise = new Date(apiData.sys.sunrise * 1000);
    weather.sunset = new Date(apiData.sys.sunset * 1000);
    weather.description = apiData.weather[0].description;
    weather.icon = apiData.weather[0].icon;

    // Use upsert to insert or update existing record
    await this.weatherRepository.upsert(weather, ['cityName']);

    const savedWeather = await this.weatherRepository.findOne({
      where: { cityName: weather.cityName },
    });

    if (!savedWeather) {
      throw new Error('Failed to save weather data');
    }

    return savedWeather;
  }

  // Update search history - increment count and update last searched time
  private async updateSearchHistory(cityName: string): Promise<void> {
    const existing = await this.searchHistoryRepository.findOne({
      where: { cityName: cityName.toLowerCase() },
    });

    if (existing) {
      existing.searchCount += 1;
      existing.lastSearched = new Date();
      await this.searchHistoryRepository.save(existing);
    } else {
      const newHistory = new SearchHistoryEntity();
      newHistory.cityName = cityName.toLowerCase();
      newHistory.searchCount = 1;
      newHistory.lastSearched = new Date();
      await this.searchHistoryRepository.save(newHistory);
    }
  }

  // Convert database entity to response DTO
  private mapToResponseDto(weather: WeatherEntity): WeatherResponseDto {
    return {
      cityName: weather.cityName,
      country: weather.city?.country || 'Unknown',
      temperature: weather.temperature,
      feelsLike: weather.feelsLike || weather.temperature,
      humidity: weather.humidity,
      windSpeed: weather.windSpeed,
      windDirection: 0, // Default value, actual wind direction should be added to WeatherEntity
      weatherCondition: weather.weatherCondition,
      pressure: weather.pressure,
      sunrise: weather.sunrise,
      sunset: weather.sunset,
      description: weather.description,
      icon: weather.icon,
      latitude: weather.city?.latitude || 0,
      longitude: weather.city?.longitude || 0,
      lastUpdated: weather.updatedAt,
    };
  }
}
