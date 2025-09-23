import {
  Controller,
  Get,
  Query,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { EnhancedWeatherService } from '../services/enhanced-weather.service';
import {
  WeatherResponseDto,
  SearchHistoryResponseDto,
  ForecastResponseDto,
  CityResponseDto,
} from '../dto/weather-response.dto';
import { GetWeatherDto } from '../dto/weather-request.dto';

@ApiTags('Weather API')
@Controller('api/weather')
export class WeatherController {
  private readonly logger = new Logger(WeatherController.name);

  constructor(private readonly weatherService: EnhancedWeatherService) {}

  @Get('current')
  @ApiOperation({ summary: 'Get current weather for a city' })
  @ApiQuery({
    name: 'city',
    description: 'Name of the city',
    example: 'London',
  })
  @ApiResponse({
    status: 200,
    description: 'Current weather data',
    type: WeatherResponseDto,
  })
  @ApiResponse({ status: 404, description: 'City not found' })
  @ApiResponse({ status: 400, description: 'Invalid API key or request' })
  async getCurrentWeather(
    @Query() query: GetWeatherDto,
  ): Promise<WeatherResponseDto> {
    try {
      this.logger.log(`Fetching current weather for: ${query.city}`);
      return await this.weatherService.getCurrentWeather(query.city);
    } catch (error: any) {
      this.logger.error(`Error fetching weather: ${error.message}`);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  } // GET /api/weather/forecast?city=London (Currently returns same as current - could be extended)
  @Get('forecast')
  async getForecast(
    @Query() query: GetWeatherDto,
  ): Promise<WeatherResponseDto> {
    try {
      this.logger.log(`Fetching forecast for: ${query.city}`);
      // For now, return current weather - this could be extended to actual forecasts
      return await this.weatherService.getCurrentWeather(query.city);
    } catch (error) {
      this.logger.error(`Error fetching forecast: ${error.message}`);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // GET /api/weather/history - Get recently searched cities
  @Get('history')
  async getSearchHistory(): Promise<SearchHistoryResponseDto[]> {
    try {
      return await this.weatherService.getSearchHistory();
    } catch (error) {
      this.logger.error(`Failed to fetch search history: ${error.message}`);
      throw new HttpException(
        'Failed to fetch search history',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
