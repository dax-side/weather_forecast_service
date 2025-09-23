import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { WeatherEntity } from './weather.entity';
import { ForecastEntity } from './forecast.entity';

@Entity('cities')
export class CityEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column()
  country: string;

  @Column('decimal', { precision: 10, scale: 7 })
  latitude: number;

  @Column('decimal', { precision: 10, scale: 7 })
  longitude: number;

  @Column({ default: 0 })
  searchCount: number;

  @Column({ nullable: true })
  lastSearched: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @OneToOne(() => WeatherEntity, (weather) => weather.city)
  currentWeather: WeatherEntity;

  @OneToMany(() => ForecastEntity, (forecast) => forecast.city)
  forecasts: ForecastEntity[];
}
