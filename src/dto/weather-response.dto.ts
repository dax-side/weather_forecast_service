import { ApiProperty } from '@nestjs/swagger';

export class WeatherResponseDto {
  @ApiProperty({ description: 'Name of the city' })
  cityName: string;

  @ApiProperty({ description: 'Country code', example: 'US' })
  country: string;

  @ApiProperty({ description: 'Temperature in Celsius', example: 25.5 })
  temperature: number;

  @ApiProperty({
    description: 'Feels like temperature in Celsius',
    example: 27.2,
  })
  feelsLike: number;

  @ApiProperty({ description: 'Humidity percentage', example: 65 })
  humidity: number;

  @ApiProperty({ description: 'Wind speed in m/s', example: 3.2 })
  windSpeed: number;

  @ApiProperty({ description: 'Wind direction in degrees', example: 180 })
  windDirection: number;

  @ApiProperty({ description: 'Weather condition', example: 'Clear' })
  weatherCondition: string;

  @ApiProperty({ description: 'Atmospheric pressure in hPa', example: 1013 })
  pressure: number;

  @ApiProperty({ description: 'Sunrise time' })
  sunrise: Date;

  @ApiProperty({ description: 'Sunset time' })
  sunset: Date;

  @ApiProperty({ description: 'Weather description', example: 'clear sky' })
  description: string;

  @ApiProperty({ description: 'Weather icon code', example: '01d' })
  icon: string;

  @ApiProperty({ description: 'Latitude coordinate' })
  latitude: number;

  @ApiProperty({ description: 'Longitude coordinate' })
  longitude: number;

  @ApiProperty({ description: 'Last updated timestamp' })
  lastUpdated: Date;
}

export class ForecastItemDto {
  @ApiProperty({ description: 'Forecast date and time' })
  forecastDate: Date;

  @ApiProperty({ description: 'Temperature in Celsius' })
  temperature: number;

  @ApiProperty({ description: 'Humidity percentage' })
  humidity: number;

  @ApiProperty({ description: 'Wind speed in m/s' })
  windSpeed: number;

  @ApiProperty({ description: 'Wind direction in degrees' })
  windDirection: number;

  @ApiProperty({ description: 'Atmospheric pressure in hPa' })
  pressure: number;

  @ApiProperty({ description: 'Weather condition' })
  weatherMain: string;

  @ApiProperty({ description: 'Weather description' })
  weatherDescription: string;

  @ApiProperty({ description: 'Rain volume in mm', nullable: true })
  rainVolume?: number;

  @ApiProperty({ description: 'Probability of precipitation', nullable: true })
  probability?: number;

  @ApiProperty({ description: 'Weather icon code' })
  icon: string;
}

export class ForecastResponseDto {
  @ApiProperty({ description: 'Name of the city' })
  cityName: string;

  @ApiProperty({ description: 'Country code' })
  country: string;

  @ApiProperty({
    description: 'List of forecast items',
    type: [ForecastItemDto],
  })
  forecasts: ForecastItemDto[];
}

export class SearchHistoryResponseDto {
  @ApiProperty({ description: 'Name of the city' })
  cityName: string;

  @ApiProperty({ description: 'Number of times searched' })
  searchCount: number;

  @ApiProperty({ description: 'Last search timestamp' })
  lastSearched: Date;
}

export class CityResponseDto {
  @ApiProperty({ description: 'City ID' })
  id: number;

  @ApiProperty({ description: 'City name' })
  name: string;

  @ApiProperty({ description: 'Country code' })
  country: string;

  @ApiProperty({ description: 'Latitude coordinate' })
  latitude: number;

  @ApiProperty({ description: 'Longitude coordinate' })
  longitude: number;

  @ApiProperty({ description: 'Search count' })
  searchCount: number;

  @ApiProperty({ description: 'Last searched timestamp' })
  lastSearched: Date;
}
