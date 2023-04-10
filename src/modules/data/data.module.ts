import { Module } from '@nestjs/common';
import { DataService } from './data.service';
import { DataController } from './data.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { RentalStatus } from './entities/rentalStatus.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Role, RentalStatus])],
  controllers: [DataController],
  providers: [DataService],
})
export class DataModule {}
