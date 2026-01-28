import type { PostingServiceManager } from '../../core/entities/service.js';
import type { UserEntry, UserProfile } from '../../core/entities/user.js';
import { isUserProfileUpdatable } from '../../core/entities/user.js';
import { users } from '../data-managers/users.js';
import { postingServiceManagers } from '../posting-service-managers/index.js';

export async function updateUsers() {
  console.group('Updating users...');

  const userEntries = await users.getAllEntries(true);

  try {
    await Promise.all(postingServiceManagers.map((service) => updateServiceUsers(service, userEntries)));
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error updating users: ${error.message}`);
    }
  }

  console.groupEnd();
}

async function updateServiceUsers(service: PostingServiceManager, userEntries: UserEntry[]) {
  let failCount = 0;

  const updatableProfiles = userEntries.flatMap(
    ([id, user]): Array<[id: string, user: UserProfile]> =>
      user?.profiles
        ?.filter(
          (user) =>
            user.service === service.id && (isUserProfileUpdatable(user) || Boolean(process.env.FORCE_UPDATE_USERS)),
        )
        ?.map((user) => [id, user]) ?? [],
  );

  if (updatableProfiles.length === 0) {
    console.info(`No ${service.name} user profiles to update.`);
    return;
  }

  console.info(`Found ${updatableProfiles.length} ${service.name} user profiles to update.`);

  try {
    await service.connect();
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error connecting ${service.name}: ${error.message}`);
    }
    return;
  }

  for (const [id, user] of updatableProfiles) {
    try {
      await service.updateUserProfile(user);
      await users.save();
      console.info(`Updated ${service.name} profile for user "${id}".`);
      failCount = 0;
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error updating ${service.name} profile for user "${id}": ${error.message}`);
      }
      failCount++;
      if (failCount >= 5) {
        console.info(
          `Successively failed ${failCount} ${service.name} profile update attempts. Will continue updating on next run.`,
        );
        break;
      }
    }
  }

  await service.disconnect();
}
