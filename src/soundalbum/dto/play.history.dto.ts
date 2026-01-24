import {
  IsBoolean,
  isNumber,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class PlayHistoryDto {
  @IsString({ message: 'platform不能为空' })
  platform: string;

  @IsString({ message: 'soundAlbumId不能为空' })
  soundAlbumId: string;

  @IsString({ message: 'songId不能为空' })
  songId: string;

  @IsNumber()
  playDuration: number;

  @IsNumber()
  playPosition: number;

  @IsNumber()
  @IsOptional()
  sort: number;
}
