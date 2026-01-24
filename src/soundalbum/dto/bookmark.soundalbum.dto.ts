import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class BookmarkSoundAlbumDto {
  @IsString({ message: 'platform不能为空' })
  platform: string;

  @IsString({ message: 'albumId不能为空' })
  albumId: string;

  @IsString({ message: 'albumImg不能为空' })
  albumImg: string;

  @IsString({ message: 'albumTitle不能为空' })
  albumTitle: string;

  @IsNumber()
  countOfSounds: number;

  @IsString({ message: 'desc不能为空' })
  desc: string;

  @IsString({ message: 'vipType不能为空' })
  vipType: VipType;

  @IsBoolean()
  isFinished: boolean;

  @IsString({ message: 'soundAlbumUpdateAt不能为空' })
  soundAlbumUpdateAt: string;

  @IsOptional()
  releaseDate: string;
}
