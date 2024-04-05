import type { User, UserProfiles } from '../entities/user.js';
import { mergeUserWith } from '../entities/user.js';
import { loadYaml, saveYaml } from './utils/yaml.js';

export const USERS_FILENAME = 'data/users.yml';

export type Users = Map<string, User>;

let cachedUsers: Users | undefined;

export function createUserId(user: User) {
  const str = user.name || Object.values(user.profiles || {})[0];

  return str
    ?.toLowerCase()
    .replace("'", '')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-/g, '')
    .replace(/-$/g, '');
}

export async function mergeUser(partialUser: User): Promise<[string, User]> {
  const entry = await findUser(partialUser);
  let id = entry?.[0];
  const user = entry?.[1] ?? {};
  const users = await load();

  if (!id) {
    id = createUserId(partialUser);
    if (!id) {
      throw new Error(`Cannot create user ${partialUser}`);
    }
  }

  mergeUserWith(user, partialUser);
  users.set(id, user);

  await save();

  return [id, user];
}

export async function findUser(value: User): Promise<[string, User] | undefined> {
  const users = await load();

  return [...users.entries()].find(
    ([_, user]) =>
      (user.name && user.name === value.name) ||
      (user.nameRu && user.nameRu === value.nameRu) ||
      (user.nameRuFrom && user.nameRuFrom === value.nameRuFrom) ||
      (user.profiles &&
        Object.entries(user.profiles).some(
          ([service, profile]) => profile === value.profiles?.[service as keyof UserProfiles],
        )),
  );
}

export async function getUser(id: string): Promise<User | undefined> {
  const users = await load();

  return users.get(id);
}

export async function load(): Promise<Users> {
  const currentCachedUsers = cachedUsers;
  if (currentCachedUsers) {
    return currentCachedUsers;
  }

  try {
    const entries = Object.entries((await loadYaml(USERS_FILENAME)) as object);

    if (!cachedUsers) {
      cachedUsers = new Map(entries);
    }

    return cachedUsers;
  } catch (error) {
    const message = error instanceof Error ? error.message : error;
    throw new Error(`Error loading users: ${message}`);
  }
}

export async function save() {
  if (!cachedUsers) {
    return;
  }

  const data = Object.fromEntries(cachedUsers.entries());
  return saveYaml(USERS_FILENAME, data);
}
