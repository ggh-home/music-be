import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  Index,
} from 'typeorm';

@Entity('playlist') // 对应数据库表名
@Index('I_PALYLIST_ID', ['playListId'])
@Index('I_USER_ID', ['userId'])
export class Playlist {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'type' })
  type: string;

  @Column({ name: 'playlist_name' })
  playListName: string;

  @Column({ name: 'playlist_img', nullable: true })
  playListImg: string;

  @Column({ name: 'playlist_id', nullable: true })
  playListId: string;

  @Column({ name: 'platform', nullable: true })
  platform: string;

  @Column({ name: 'user_id' })
  userId: number;

  @CreateDateColumn({ name: 'create_time', type: 'datetime' })
  createTime: Date;

  @BeforeInsert() // 在实体插入之前设置 update_time 为 null
  setInitialUpdateTime() {
    this.updateTime = null; // 首次创建时，update_time 字段为 null
  }

  @UpdateDateColumn({ name: 'update_time', type: 'datetime', nullable: true })
  updateTime: Date;
}
