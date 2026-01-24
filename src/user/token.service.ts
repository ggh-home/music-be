import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Injectable } from '@nestjs/common';
import { UserStatusCode } from 'src/enums/user-status-code.enum';

@Injectable()
export class TokenService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async validateToken(token: string): Promise<User> {
    // todo 这里来检验更多的信息
    // 只有Active和Blocked状态，并且用户没有过期，可以返回有效的user
    // 其他状态不能返回有效的user对象
    // 登录的时候再来处理详细的状态逻辑
    const user = await this.userRepository.findOne({ where: { token } });
    if (
      user !== null &&
      (user.status === UserStatusCode.ACTIVE ||
        user.status === UserStatusCode.BLOCKED) &&
      user.expiredTime > new Date()
    ) {
      return user;
    } else {
      return null;
    }
  }
}
