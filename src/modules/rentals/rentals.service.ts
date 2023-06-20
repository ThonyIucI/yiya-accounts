import { ConflictException, Injectable } from '@nestjs/common';
import { CreateRentalDto } from './dto/create-rental.dto';
import { UpdateRentalDto } from './dto/update-rental.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Rental } from './entities/rental.entity';
import { Repository } from 'typeorm';
import {
  createdMessage,
  deletedMessage,
  updatedMessage,
} from 'src/utils/message.manager';
import { ErrorManager } from 'src/utils/error.manager';
import { Profile } from '../profiles/entities/profile.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class RentalsService {
  constructor(
    @InjectRepository(Rental)
    private readonly rentalRepository: Repository<Rental>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
  ) {}
  generateRentalCode(name: string): string {
    const currentDate = new Date();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const day = currentDate.getDate().toString().padStart(2, '0');
    const hours = currentDate.getHours().toString().padStart(2, '0');

    const initials = name.slice(0, 3).toUpperCase();
    const rentalCode = `${initials}-${month}${day}${hours}`;

    return rentalCode;
  }
  async verifyDuplicated(rentalCode: string, id?: number) {
    const existingSupplier = await this.rentalRepository.findOne({
      where: { rentalCode },
    });

    if (existingSupplier && existingSupplier.id !== id) {
      throw new ConflictException(
        'El código de renta se repite, elija uno nuevo.',
      );
    }
  }
  async create(createRentalDto: CreateRentalDto) {
    const { clientId, profilesIds } = createRentalDto;
    const client = await this.userRepository.findOneOrFail({
      where: { id: clientId },
    });

    try {
      const renta = await this.rentalRepository.save({
        ...createRentalDto,
        rentalCode: this.generateRentalCode(client.firstName),
      });
      if (renta) {
        if (profilesIds.length) {
          //si existe renta y también eisten perfiles
          await Promise.all(
            profilesIds.map(async (id) => {
              await this.verifyAvailableProfile(id);
              await this.profileRepository.update(id, {
                available: false,
                rentalId: renta.id,
              });
            }),
          );
        }
        return createdMessage(renta);
      }
    } catch (error) {
      throw ErrorManager.createSignatureError(error);
    }
  }

  async findAll() {
    try {
      return await this.rentalRepository.find();
    } catch (error) {
      throw ErrorManager.createSignatureError(error);
    }
  }

  async findOne(id: number) {
    try {
      const item = await this.rentalRepository.findOneOrFail({
        where: { id },
        relations: ['client', 'rentalStatus', 'profiles', 'combo'],
      });
      const profilesIds = item.profiles.map((profile) => profile.id);
      return { ...item, profilesIds };
    } catch (error) {
      throw ErrorManager.createSignatureError(error);
    }
  }
  async verifyAvailableProfile(profileId: number) {
    const availableProfile = await this.profileRepository.findOneOrFail({
      where: { id: profileId },
    });
    if (!availableProfile.available)
      throw new ConflictException(
        `El perfil ${availableProfile.profileName} no se encuentra disponible`,
      );
  }
  async update(id: number, updateRentalDto: UpdateRentalDto) {
    const { profilesIds } = updateRentalDto;

    const existingRental = await this.rentalRepository.findOneOrFail({
      where: { id },
      relations: ['profiles'],
    });

    const perfilesActuales = existingRental.profiles.map((perfil) => perfil.id);
    // console.log(existingRental, perfilesActuales);

    // Perfiles a crear una relación
    const newProfiles = profilesIds.filter(
      (id) => !perfilesActuales.includes(id),
    );
    // Perfiles a eliminar una relación
    const perfilesEliminar = perfilesActuales.filter(
      (id) => !profilesIds.includes(id),
    );
    console.log(newProfiles, perfilesEliminar);

    try {
      if (perfilesEliminar.length) {
        await Promise.all(
          perfilesEliminar.map(async (profileId) => {
            await this.profileRepository.update(profileId, {
              available: true,
              rentalId: null,
            });
          }),
        );
      }
      if (newProfiles.length) {
        await Promise.all(
          newProfiles.map(async (profileId) => {
            await this.verifyAvailableProfile(profileId);
            await this.profileRepository.update(profileId, {
              available: false,
              rentalId: id,
            });
          }),
        );
      }

      const item = await this.findOne(id);
      return updatedMessage(item);
    } catch (error) {
      throw ErrorManager.createSignatureError(error);
    }
  }

  async remove(id: number) {
    try {
      await this.rentalRepository.delete(id);
      return deletedMessage();
    } catch (error) {
      throw ErrorManager.createSignatureError(error);
    }
  }
}
