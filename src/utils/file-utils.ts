import { constants } from 'fs';
import fs from 'fs/promises';
import { rimraf } from 'rimraf';

export async function pathExists(pathname: string) {
  try {
    await fs.access(pathname, constants.F_OK);
    return true;
  } catch {}
  return false;
}

export async function createEmptyDir(pathname: string) {
  await rimraf(pathname);
  return await fs.mkdir(pathname, { recursive: true });
}
