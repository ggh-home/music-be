import { Expose } from 'class-transformer';

export class UserResponseDto {
  @Expose()
  userName: string;

  @Expose()
  expiredTime: Date;

  @Expose()
  createTime: Date;

  @Expose()
  token: string;

  @Expose()
  weiXin: string;

  @Expose()
  userType: string;
}
