import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CityEntity } from './city.entity';

@Entity('forecasts')
export class ForecastEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  cityId: number;

  @Column()
  forecastDate: Date;

  @Column('decimal', { precision: 5, scale: 2 })
  temperature: number;

  @Column()
  humidity: number;

  @Column('decimal', { precision: 5, scale: 2 })
  windSpeed: number;

  @Column()
  windDirection: number;

  @Column()
  pressure: number;

  @Column()
  weatherMain: string;

  @Column()
  weatherDescription: string;

  @Column({ nullable: true })
  rainVolume: number;

  @Column({ nullable: true })
  probability: number;

  @Column({ nullable: true })
  icon: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationship
  @ManyToOne(() => CityEntity, (city) => city.forecasts)
  @JoinColumn({ name: 'cityId' })
  city: CityEntity;
}
