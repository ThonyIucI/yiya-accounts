import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RentalStatus } from './entities/rentalStatus.entity';
import { Role } from './entities/role.entity';

@Injectable()
export class DataService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(RentalStatus)
    private readonly rentalStatusRepository: Repository<RentalStatus>,
  ) {}
  create() {
    try {
      // Creating Roles
      const roles = [{ name: 'admin' }, { name: 'client' }];
      this.roleRepository.insert(roles);

      // Creating rentalStatuses
      const rentalStatuses = [{ name: 'paid' }, { name: 'pending' }];
      this.rentalStatusRepository.insert(rentalStatuses);

      return 'Data created succesfully';
    } catch (error) {
      throw new Error(error);
    }
  }

  findAllRoles() {
    try {
      return this.roleRepository.find();
    } catch (error) {
      throw new Error(error);
    }
  }
  findAllRentalStatuses() {
    try {
      return this.rentalStatusRepository.find();
    } catch (error) {
      throw new Error(error);
    }
  }
}
