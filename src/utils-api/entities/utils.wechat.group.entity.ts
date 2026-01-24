import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('utils_wechat_groups') // 对应数据库表名
export class UtilsWechatGroup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'group_name' })
  groupName: string;

  @Column({ name: 'group_img', type: 'text' })
  groupImg: string;

  @Column({ name: 'max_count' })
  maxCount: number;

  @Column({ name: 'scan_count' })
  scanCount: number;

  @Column()
  order: number;

  @Column({ name: 'expired_time', type: 'datetime' })
  expiredTime: Date;

  @CreateDateColumn({ name: 'create_time', type: 'datetime' })
  createTime: Date;
}
