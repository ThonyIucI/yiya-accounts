import { ConflictException, Injectable } from '@nestjs/common';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Supplier } from './entities/supplier.entity';
import { Repository } from 'typeorm';
import { ErrorManager } from 'src/utils/error.manager';
import {
  createdMessage,
  deletedMessage,
  updatedMessage,
} from 'src/utils/message.manager';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private readonly supplierRepository: Repository<Supplier>,
  ) {}
  async verifyDuplicated(name: string, id?: number) {
    const existingSupplier = await this.supplierRepository.findOne({
      where: { name },
    });

    if (existingSupplier && existingSupplier.id !== id) {
      throw new ConflictException(
        'El nombre del proveedor ya está en uso. Por favor, ingrese un nombre único.',
      );
    }
  }
  async create(createSupplierDto: CreateSupplierDto) {
    const { name } = createSupplierDto;
    await this.verifyDuplicated(name);
    try {
      const item = await this.supplierRepository.save(createSupplierDto);
      if (item) return createdMessage(item);
    } catch (error) {
      throw ErrorManager.createSignatureError(error);
    }
  }

  async findAll() {
    try {
      return await this.supplierRepository.find();
    } catch (error) {
      throw ErrorManager.createSignatureError(error);
    }
  }

  async findOne(id: number) {
    try {
      return await this.supplierRepository.findOneOrFail({ where: { id } });
    } catch (error) {
      throw ErrorManager.createSignatureError(error);
    }
  }

  async update(id: number, updateSupplierDto: UpdateSupplierDto) {
    const { name } = updateSupplierDto;
    if (name) await this.verifyDuplicated(name, id);
    try {
      await this.supplierRepository.update(id, updateSupplierDto);
      const item = await this.findOne(id);
      return updatedMessage(item);
    } catch (error) {
      throw ErrorManager.createSignatureError(error);
    }
  }

  async remove(id: number) {
    try {
      await this.supplierRepository.delete(id);
      return deletedMessage();
    } catch (error) {
      throw ErrorManager.createSignatureError(error);
    }
  }
}
