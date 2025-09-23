import { IsString, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetWeatherDto {
  @ApiProperty({
    description: 'Name of the city to get weather for',
    example: 'London',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  city: string;
}

export class SearchCityDto {
  @ApiProperty({
    description: 'Name of the city to search',
    example: 'New York',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  cityName: string;
}