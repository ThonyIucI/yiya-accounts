import { DB } from '../database.source';
import { Role } from 'src/modules/data/entities/role.entity';
import { RentalStatus } from 'src/modules/data/entities/rentalStatus.entity';

export const seedRentalStatuses = async () => {
  // Creating Roles
  const roles = [{ name: 'admin' }, { name: 'client' }];
  await DB.insert(Role, roles);

  // Creating rentalStatuses
  const rentalStatuses = [{ name: 'paid' }, { name: 'pending' }];
  await DB.insert(RentalStatus, rentalStatuses);
};

// seedRentalStatuses();
