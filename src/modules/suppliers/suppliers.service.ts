import { Injectable } from '@nestjs/common';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Supplier } from './entities/supplier.entity';
import { Repository } from 'typeorm';
import { ErrorManager } from 'src/utils/error.manager';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private readonly serviceRepository: Repository<Supplier>,
  ) {}
  async create(createSupplierDto: CreateSupplierDto) {
    try {
      const item = await this.serviceRepository.insert(createSupplierDto);
      if (item) return 'Información guardada exitosamente';
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  }

  async findAll() {
    try {
      return await this.serviceRepository.find();
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  }

  async findOne(id: number) {
    try {
      return await this.serviceRepository.findOneOrFail({ where: { id } });
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  }

  async update(id: number, updateSupplierDto: UpdateSupplierDto) {
    try {
      await this.serviceRepository.update(id, updateSupplierDto);
      return 'Información actualizada exitosamente';
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  }

  async remove(id: number) {
    try {
      await this.serviceRepository.delete(id);
      return 'Información eliminada exitosamente';
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  }
}
