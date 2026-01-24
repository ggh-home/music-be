import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('user_action') // 对应数据库表名
export class UserAction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'action' })
  action: string;

  @Column({ name: 'created_date' })
  createdDate: string;

  @Column({ name: 'created_hour' })
  createdHour: string;

  @CreateDateColumn({ name: 'create_time', type: 'datetime' })
  createTime: Date;
}
