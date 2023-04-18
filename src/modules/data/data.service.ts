import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RentalStatus } from './entities/rentalStatus.entity';
import { Role } from './entities/role.entity';
import { Service } from '../services/entities/service.entity';
import { ErrorManager } from 'src/utils/error.manager';

@Injectable()
export class DataService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(RentalStatus)
    private readonly rentalStatusRepository: Repository<RentalStatus>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
  ) {}
  create() {
    try {
      // Creating Roles
      const roles = [{ name: 'admin' }, { name: 'client' }];
      this.roleRepository.upsert(roles, ['name']);

      // Creating rentalStatuses
      const rentalStatuses = [{ name: 'paid' }, { name: 'pending' }];
      this.rentalStatusRepository.upsert(rentalStatuses, ['name']);

      const services = [
        {
          name: 'Netflix Premium',
          originalPurchasePrice: 45,
        },
        {
          name: 'HBO',
          originalPurchasePrice: 26.63,
        },
        {
          name: 'Star+',
          originalPurchasePrice: 44.9,
        },
        {
          name: 'Disney+',
          originalPurchasePrice: 44.9,
        },
        {
          name: 'Amazon Prime',
          originalPurchasePrice: 57.82,
        },
        {
          name: 'Spotify',
          originalPurchasePrice: 18.9,
        },
        {
          name: 'Youtube Premium',
          originalPurchasePrice: 20.9,
        },
      ];
      this.serviceRepository.upsert(services, ['name']);
      return 'Data created succesfully';
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  }

  findAllRoles() {
    try {
      return this.roleRepository.find();
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  }
  findAllRentalStatuses() {
    try {
      return this.rentalStatusRepository.find();
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  }
}
