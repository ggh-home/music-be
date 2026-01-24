import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from 'typeorm';

@Entity('cookies') // 对应数据库表名
export class Cookies {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'platform' })
  platform: string;

  @Column({ name: 'cookie', type: 'text' })
  cookie: string;

  @CreateDateColumn({ name: 'create_time', type: 'datetime' })
  createTime: Date;

  @BeforeInsert() // 在实体插入之前设置 update_time 为 null
  setInitialUpdateTime() {
    this.updateTime = null; // 首次创建时，update_time 字段为 null
  }

  @UpdateDateColumn({ name: 'update_time', type: 'datetime', nullable: true })
  updateTime: Date;
}
