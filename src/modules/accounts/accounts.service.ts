import { Injectable } from '@nestjs/common';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { Repository } from 'typeorm';
import { Account } from './entities/account.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ErrorManager } from 'src/utils/error.manager';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
  ) {}
  async create(createAccountDto: CreateAccountDto) {
    try {
      const item = await this.accountRepository.insert(createAccountDto);
      if (item) return 'Información guardada exitosamente';
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  }

  async findAll() {
    try {
      return await this.accountRepository.find({
        relations: ['supplier', 'service'],
      });
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  }

  async findOne(id: number) {
    try {
      const item = await this.accountRepository.findOne({
        where: { id },
      });
      if (!item) {
        throw new ErrorManager({
          type: 'NOT_FOUND',
          message: 'No se encontró el elemento',
        });
      }
      return item;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  }

  async update(id: number, updateAccountDto: UpdateAccountDto) {
    try {
      const exists = await this.findOne(id);
      if (exists) {
        const item = await this.accountRepository.update(id, updateAccountDto);
        if (item.affected === 0) {
          throw new ErrorManager({
            type: 'BAD_REQUEST',
            message: 'No se pudo actualizar la información',
          });
        }
        return 'Información actualizada exitosamente';
      }
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  }

  async remove(id: number) {
    try {
      await this.accountRepository.delete(id);
      return 'Información eliminada exitosamente';
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  }
}
