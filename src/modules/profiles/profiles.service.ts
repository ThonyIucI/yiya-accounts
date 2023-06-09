import { ConflictException, Injectable } from '@nestjs/common';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Profile } from './entities/profile.entity';
import { Repository } from 'typeorm';
import {
  createdMessage,
  deletedMessage,
  updatedMessage,
} from 'src/utils/message.manager';
import { ErrorManager } from 'src/utils/error.manager';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
  ) {}
  async verifyDuplicated(profileName: string, id?: number) {
    const existingSupplier = await this.profileRepository.findOne({
      where: { profileName },
    });

    if (existingSupplier && existingSupplier.id !== id) {
      throw new ConflictException(
        'El nombre del proveedor ya está en uso. Por favor, ingrese un nombre único.',
      );
    }
  }
  async create(createProfileDto: CreateProfileDto) {
    try {
      const item = await this.profileRepository.save(createProfileDto);
      if (item) return createdMessage(item);
    } catch (error) {
      throw ErrorManager.createSignatureError(error);
    }
  }

  async findAll() {
    try {
      return await this.profileRepository.find();
    } catch (error) {
      throw ErrorManager.createSignatureError(error);
    }
  }

  async findOne(id: number) {
    try {
      return await this.profileRepository.findOneOrFail({ where: { id } });
    } catch (error) {
      throw ErrorManager.createSignatureError(error);
    }
  }

  async update(id: number, updateProfileDto: UpdateProfileDto) {
    try {
      await this.profileRepository.update(id, updateProfileDto);
      const item = await this.findOne(id);
      return updatedMessage(item);
    } catch (error) {
      throw ErrorManager.createSignatureError(error);
    }
  }

  async remove(id: number) {
    try {
      await this.profileRepository.delete(id);
      return deletedMessage();
    } catch (error) {
      throw ErrorManager.createSignatureError(error);
    }
  }
}
