import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from 'typeorm';

@Entity('cache_songs') // 对应数据库表名
export class CacheSongs {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'platform' })
  platform: string;

  @Column({ name: 'song_id' })
  songId: string;

  @Column({ name: 'song_img', nullable: true })
  songImg: string;

  @Column({ name: 'song_url', nullable: true, type: 'text' })
  songUrl: string;

  @Column({ name: 'song_lyric', nullable: true, type: 'text' })
  songLyric: string;

  @Column({ name: 'cache_path', nullable: true })
  cachePath: string;

  @Column({ name: 'cache_no_loss_path', nullable: true })
  cacheNoLossPath: string;

  @Column({ name: 'cache_surround_path', nullable: true })
  cacheSurroundPath: string;

  @Column({ name: 'used_count', default: 0 })
  usedCount: number;

  @Column({ name: 'cache_status', default: 'Uploading' })
  cacheStatus: CacheStatus;

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
