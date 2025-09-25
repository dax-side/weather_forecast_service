import { IsString, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

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
  @Transform(({ value }: { value: string }) => value?.trim()) // Added proper typing
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
  @Transform(({ value }: { value: string }) => value?.trim()) // Added proper typing
  cityName: string;
}
