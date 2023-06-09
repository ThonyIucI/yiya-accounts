import { Injectable } from '@nestjs/common';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { Repository } from 'typeorm';
import { Account } from './entities/account.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ErrorManager } from 'src/utils/error.manager';
import { Profile } from '../profiles/entities/profile.entity';
import {
  createdMessage,
  deletedMessage,
  updatedMessage,
} from 'src/utils/message.manager';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>, // @InjectRepository(Profile) // private readonly profileRepository: Repository<Profile>,
  ) {}
  async create(createAccountDto: CreateAccountDto) {
    try {
      const item = await this.accountRepository.save(createAccountDto);
      if (item) {
        const account = await this.findOne(item.id);
        // Crear los respectivos perfiles para cada cuenta
        for (let index = 0; index < account.service.profilesNumber; index++) {
          await this.profileRepository.save({
            accountId: account.id,
            profileName: `${account.service.name} ${index + 1}`,
            priceRent: account.profilePrice,
          });
        }
        return createdMessage(item);
      }
    } catch (error) {
      throw ErrorManager.createSignatureError(error);
    }
  }

  async findAll() {
    try {
      return await this.accountRepository.find({
        relations: ['service'],
      });
    } catch (error) {
      throw ErrorManager.createSignatureError(error);
    }
  }

  async findOne(id: number) {
    try {
      return await this.accountRepository.findOneOrFail({
        where: { id },
        relations: ['supplier', 'service', 'profiles'],
      });
    } catch (error) {
      throw ErrorManager.createSignatureError(error);
    }
  }

  async update(id: number, updateAccountDto: UpdateAccountDto) {
    try {
      await this.accountRepository.update(id, updateAccountDto);
      const item = await this.accountRepository.findOneOrFail({
        where: { id },
      });
      return updatedMessage(item);
    } catch (error) {
      throw ErrorManager.createSignatureError(error);
    }
  }

  async remove(id: number) {
    try {
      await this.accountRepository.delete(id);
      return deletedMessage();
    } catch (error) {
      throw ErrorManager.createSignatureError(error);
    }
  }
}
