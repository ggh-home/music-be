import { UserStatusCode } from 'src/enums/user-status-code.enum';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from 'typeorm';

type UserType = 'FREE' | 'VIP';

type UpdateVipByWX = 'YES';

@Entity('user') // 对应数据库表名
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_name' })
  userName: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  token: string;

  @Column({ name: 'device_model', nullable: true })
  deviceModel: string;

  @Column({ name: 'system_version', nullable: true })
  systemVersion: string;

  @Column({ nullable: true })
  brand: string;

  @Column()
  status: UserStatusCode;

  @Column({ name: 'wei_xin', nullable: true })
  weiXin: string;

  @Column({ name: 'user_type', nullable: true })
  userType: UserType;

  @Column({ name: 'remark', nullable: true })
  remark: string;

  @Column({ name: 'blocked_to_time', type: 'datetime', nullable: true })
  blockedToTime: Date;

  @Column({ name: 'vip_to_time', type: 'datetime', nullable: true })
  vipToTime: Date;

  @Column({ name: 'update_vip_by_wx', nullable: true })
  updateVipByWx: UpdateVipByWX;

  @Column({ name: 'expired_time', type: 'datetime', nullable: true })
  expiredTime: Date;

  @CreateDateColumn({ name: 'create_time', type: 'datetime' })
  createTime: Date;

  @BeforeInsert() // 在实体插入之前设置 update_time 为 null
  setInitialUpdateTime() {
    this.updateTime = null; // 首次创建时，update_time 字段为 null
  }

  @UpdateDateColumn({ name: 'update_time', type: 'datetime', nullable: true })
  updateTime: Date;
}
