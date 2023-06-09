import { Injectable } from '@nestjs/common';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { Client } from './entities/client.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from '../suppliers/entities/supplier.entity';
import {
  createdMessage,
  deletedMessage,
  updatedMessage,
} from 'src/utils/message.manager';
import { ErrorManager } from 'src/utils/error.manager';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Supplier>,
  ) {}
  async create(createClientDto: CreateClientDto) {
    try {
      const item = await this.clientRepository.save(createClientDto);
      if (item) return createdMessage(item);
    } catch (error) {
      throw ErrorManager.createSignatureError(error);
    }
  }

  async findAll() {
    try {
      return await this.clientRepository.find();
    } catch (error) {
      throw ErrorManager.createSignatureError(error);
    }
  }

  async findOne(id: number) {
    try {
      return await this.clientRepository.findOneOrFail({
        where: { id },
        relations: ['rentals'],
      });
    } catch (error) {
      throw ErrorManager.createSignatureError(error);
    }
  }

  async update(id: number, updateClientDto: UpdateClientDto) {
    try {
      await this.clientRepository.update(id, updateClientDto);
      const item = await this.findOne(id);
      return updatedMessage(item);
    } catch (error) {
      throw ErrorManager.createSignatureError(error);
    }
  }

  async remove(id: number) {
    try {
      await this.clientRepository.delete(id);
      return deletedMessage();
    } catch (error) {
      throw ErrorManager.createSignatureError(error);
    }
  }
}
