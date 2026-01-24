import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('user_msg') // 对应数据库表名
export class UserMsg {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'target_user_ids' })
  targetUserIds: string;

  @Column({ name: 'target_user_type' })
  targetUserType: string;

  @Column({ name: 'msg_title' })
  msgTitle: string;

  @Column({ name: 'msg_type' })
  msgType: string;

  @Column({ name: 'msg_content', type: 'text' })
  msgContent: string;

  @CreateDateColumn({ name: 'create_time', type: 'datetime' })
  createTime: Date;
}
