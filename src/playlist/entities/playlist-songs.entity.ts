import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  Index,
} from 'typeorm';

@Entity('playlist_songs') // 对应数据库表名
@Index('I_PLAYLIST_ID', ['playListId'])
@Index('I_USER_ID', ['userId'])
@Index('I_PLATFORM_SONG_ID', ['platform', 'songId'])
export class PlaylistSong {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'playlist_id' })
  playListId: number;

  @Column({ name: 'platform' })
  platform: string;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'song_id' })
  songId: string;

  @Column({ name: 'song_title' })
  songTitle: string;

  @Column({ name: 'song_img' })
  songImg: string;

  @Column({ name: 'singer_name' })
  singerName: string;

  @Column({ name: 'album_id', nullable: true })
  albumId: string;

  @Column({ name: 'album_title' })
  albumTitle: string;

  @Column({ name: 'song_type', nullable: true })
  songType?: SongType;

  @Column({ name: 'valid' })
  valid: boolean;

  @Column('json', { name: 'raw_detail' })
  rawDetail: any;

  @CreateDateColumn({ name: 'create_time', type: 'datetime' })
  createTime: Date;

  @BeforeInsert() // 在实体插入之前设置 update_time 为 null
  setInitialUpdateTime() {
    this.updateTime = null; // 首次创建时，update_time 字段为 null
  }

  @UpdateDateColumn({ name: 'update_time', type: 'datetime', nullable: true })
  updateTime: Date;
}
