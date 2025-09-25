import { Controller, Get, Post, Body, Render, Logger } from '@nestjs/common';
import { EnhancedWeatherService } from '../services/enhanced-weather.service';
import { SearchCityDto } from '../dto/weather-request.dto';

@Controller()
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name);

  constructor(private readonly weatherService: EnhancedWeatherService) {}

  // GET / - Show the main dashboard page
  @Get()
  @Render('dashboard')
  async showDashboard() {
    try {
      const history = await this.weatherService.getSearchHistory();
      return {
        title: 'Weather Forecast Service',
        history,
      };
    } catch (error: unknown) {
      // Changed to unknown
      this.logger.error(
        `Failed to load search history: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ); // Fixed unsafe access
      return {
        title: 'Weather Forecast Service',
        history: [],
        error: 'Failed to load search history',
      };
    }
  }

  // POST /search - Handle form submission from dashboard
  @Post('search')
  @Render('weather-result')
  async searchWeather(@Body() searchDto: SearchCityDto) {
    try {
      this.logger.log(`Dashboard search for: ${searchDto.cityName}`);

      const weather = await this.weatherService.getCurrentWeather(
        searchDto.cityName,
      );

      const history = await this.weatherService.getSearchHistory();

      return {
        title: `Weather in ${weather.cityName}`,
        weather,
        history,
        success: true,
      };
    } catch (error: unknown) {
      // Changed to unknown
      this.logger.error(
        `Dashboard search error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ); // Fixed unsafe access

      const history = await this.weatherService.getSearchHistory();

      return {
        title: 'Weather Search Error',
        error: error instanceof Error ? error.message : 'Unknown error', // Fixed unsafe assignment and access
        history,
        success: false,
      };
    }
  }
}
