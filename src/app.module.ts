import { Module } from '@nestjs/common';
import { UsersModule } from './modules/users/users.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSourceConfig } from './database/database.source';
import { DataModule } from './modules/data/data.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { ServicesModule } from './modules/services/services.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { CombosModule } from './modules/combos/combos.module';
import { RentalsModule } from './modules/rentals/rentals.module';
import { ClientsModule } from './modules/clients/clients.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      // envFilePath: `.${process.env.NODE_ENV}.env`,
      envFilePath: `.env`,
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(DataSourceConfig),
    UsersModule,
    DataModule,
    SuppliersModule,
    ServicesModule,
    AccountsModule,
    ProfilesModule,
    CombosModule,
    RentalsModule,
    ClientsModule,
  ],
})
export class AppModule {}
