import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
  BeforeInsert,
} from 'typeorm';

@Entity('user_logs') // 对应数据库表名
@Index('I_USER_ID', ['userId'])
@Index('I_LEVEL', ['level'])
@Index('I_ACTION', ['action'])
@Index('I_CREATE_DATE', ['createDate'])
export class UserLogs {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column()
  level: string;

  @Column()
  action: string;

  @Column()
  appVersion: string;

  @Column({ name: 'device_model', nullable: true })
  deviceModel: string;

  @Column({ name: 'system_version', nullable: true })
  systemVersion: string;

  @Column({ nullable: true })
  brand: string;

  @Column('json')
  log: any;

  @Column({
    name: 'create_date',
    type: 'date',
  })
  createDate: Date;

  @CreateDateColumn({ name: 'create_time', type: 'datetime' })
  createTime: Date;

  @BeforeInsert() // 在实体插入之前设置 update_time 为 null
  setInitialCreateDate() {
    this.createDate = new Date();
  }
}
