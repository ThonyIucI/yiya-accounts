import { Controller, Get } from '@nestjs/common';
import { DataService } from './data.service';

@Controller('data')
export class DataController {
  constructor(private readonly dataService: DataService) {}

  @Get('seed')
  create() {
    return this.dataService.create();
  }
  @Get('roles')
  findAllRoles() {
    return this.dataService.findAllRoles();
  }
  @Get('rental-statuses')
  findAllRentalStatuses() {
    return this.dataService.findAllRentalStatuses();
  }
  @Get('services')
  findAllServices() {
    return this.dataService.findAllServices();
  }
}
