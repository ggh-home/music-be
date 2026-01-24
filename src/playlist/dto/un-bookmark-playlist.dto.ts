import { IsEnum, IsString } from 'class-validator';
import { ThirdPlatformType } from '../enums/platform-type.enum';

export class UnBookmarkPlaylistDto {
  @IsString({ message: 'playListId不能为空' })
  playListId: string;

  @IsString({ message: 'platform不能为空' })
  @IsEnum(ThirdPlatformType, { message: 'platform不支持' })
  platform: string;
}
