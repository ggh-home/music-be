import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from 'typeorm';

@Entity('sound_play_history') // 对应数据库表名
export class SoundPlayHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'platform' })
  platform: string;

  @Column({ name: 'sound_album_id' })
  soundAlbumId: string;

  @Column({ name: 'song_id', nullable: true })
  songId: string;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'play_duration' })
  playDuration: number;

  @Column({ name: 'play_position' })
  playPosition: number;

  @Column({ name: 'sort' })
  sort: number;

  @Column({ name: 'percent_dec' })
  percentDesc: string;

  @CreateDateColumn({ name: 'create_time', type: 'datetime' })
  createTime: Date;

  @CreateDateColumn({ name: 'last_used_time', type: 'datetime' })
  lastUsedTime: Date;

  @BeforeInsert() // 在实体插入之前设置 update_time 为 null
  setInitialUpdateTime() {
    this.updateTime = null; // 首次创建时，update_time 字段为 null
  }

  @UpdateDateColumn({ name: 'update_time', type: 'datetime', nullable: true })
  updateTime: Date;
}
