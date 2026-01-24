import { IsOptional } from 'class-validator';

export class SetCookieDto {
  @IsOptional()
  passWord: string;

  @IsOptional()
  platform: string;

  @IsOptional()
  cookie: string;
}
