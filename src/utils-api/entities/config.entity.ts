import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('config') // 对应数据库表名
export class Config {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'config_key' })
  configKey: string;

  @Column({ name: 'config_value', type: 'text', nullable: true })
  configValue: string;
}
