import { IsOptional, IsString, Length } from 'class-validator';

export class CreatePlaylistDto {
  @IsString({ message: 'playListName无效，期望是srting' }) // 校验字段是字符串
  @Length(2, 10, {
    message: '歌单名称应在2-10之间',
  }) // 校验长度为5到10之间
  playListName: string;

  @IsOptional()
  @IsString({ message: 'image无效，期望是string' })
  image: string;
}
