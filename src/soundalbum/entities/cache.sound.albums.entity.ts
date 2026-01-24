import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from 'typeorm';

@Entity('cache_sound_albums') // 对应数据库表名
export class CacheSoundAlbums {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'platform' })
  platform: string;

  @Column({ name: 'album_id' })
  albumId: string;

  @Column({ name: 'album_img', nullable: true })
  albumImg: string;

  @Column({ name: 'album_title', nullable: true })
  albumTitle: string;

  @Column({ name: 'count_of_songs', nullable: true })
  countOfSounds: number;

  @Column({ name: 'desc', nullable: true, type: 'text' })
  desc: string;

  @Column({ name: 'vip_type', nullable: true })
  vipType: VipType;

  @Column({ name: 'is_finished' })
  isFinished: boolean;

  @Column({ name: 'cache_status' })
  cacheStatus: CacheStatus;

  @Column({ name: 'cache_check_time', type: 'datetime' })
  cacheCheckTime: Date;

  @Column({ name: 'used_count', default: 0 })
  usedCount: number;

  @Column({ name: 'sound_album_update_at' })
  soundAlbumUpdateAt: string;

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
