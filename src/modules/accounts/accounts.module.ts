import { Module } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { AccountsController } from './accounts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './entities/account.entity';
import { Profile } from '../profiles/entities/profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Account, Profile])],
  controllers: [AccountsController],
  providers: [AccountsService],
})
export class AccountsModule {}
