import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { CityEntity } from './city.entity';

@Entity('weather')
export class WeatherEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  cityName: string;

  @Column('decimal', { precision: 5, scale: 2 })
  temperature: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  feelsLike: number;

  @Column()
  humidity: number;

  @Column('decimal', { precision: 5, scale: 2 })
  windSpeed: number;

  @Column()
  weatherCondition: string;

  @Column()
  pressure: number;

  @Column()
  sunrise: Date;

  @Column()
  sunset: Date;

  @Column()
  description: string;

  @Column()
  icon: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  cityId: number;

  // Relationship
  @OneToOne(() => CityEntity, (city) => city.currentWeather)
  @JoinColumn({ name: 'cityId' })
  city: CityEntity;
}
