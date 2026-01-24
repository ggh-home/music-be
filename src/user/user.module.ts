import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserLogs } from './entities/user.logs.entity';
import { UserTaskService } from './user.task.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserLogs])],
  providers: [UserService, UserTaskService],
  controllers: [UserController],
})
export class UserModule {}
