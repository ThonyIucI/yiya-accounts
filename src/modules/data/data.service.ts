import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RentalStatus } from './entities/rentalStatus.entity';
import { Role } from './entities/role.entity';
import { Service } from '../services/entities/service.entity';
import { ErrorManager } from 'src/utils/error.manager';
import {
  accounts,
  admins,
  clients,
  rentalStatuses,
  roles,
  services,
  suppliers,
} from './data.seed';
import { User } from '../users/entities/user.entity';
import { Supplier } from '../suppliers/entities/supplier.entity';
import { AccountsService } from '../accounts/accounts.service';

@Injectable()
export class DataService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(RentalStatus)
    private readonly rentalStatusRepository: Repository<RentalStatus>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Supplier)
    private readonly supplierRepository: Repository<Supplier>,
    private readonly accountsService: AccountsService,
  ) {}
  async create() {
    try {
      // Creating Roles
      await this.roleRepository.upsert(roles, ['name']);

      // Creating rentalStatuses
      await this.rentalStatusRepository.upsert(rentalStatuses, ['name']);

      // Creating services
      await this.serviceRepository.upsert(services, ['name']);

      // Creating admins
      await this.userRepository.upsert(admins, ['email']);

      // Creating clients
      await this.userRepository.upsert(clients, ['phone']);

      // Creating suppliers
      await this.supplierRepository.upsert(suppliers, ['name']);

      // Creating accounts
      await Promise.all(
        accounts.map(async (account) => {
          await this.accountsService.create(account);
        }),
      );

      return 'Data created succesfully';
    } catch (error) {
      throw ErrorManager.createSignatureError(error);
    }
  }

  findAllRoles() {
    try {
      return this.roleRepository.find();
    } catch (error) {
      throw ErrorManager.createSignatureError(error);
    }
  }
  findAllServices() {
    try {
      return this.serviceRepository.find();
    } catch (error) {
      throw ErrorManager.createSignatureError(error);
    }
  }
  findAllRentalStatuses() {
    try {
      return this.rentalStatusRepository.find();
    } catch (error) {
      throw ErrorManager.createSignatureError(error);
    }
  }
}
