import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('search_history')
export class SearchHistoryEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  cityName: string;

  @Column({ default: 1 })
  searchCount: number;

  @Column()
  lastSearched: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}