import { readFile } from 'fs/promises';
import { exec } from 'node:child_process';

export async function createRelease() {
  console.group('Creating project release...');

  console.info('Checking if there are some changes to release...');

  let isEmpty = true;

  try {
    isEmpty = await releaseIsEmpty();
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error checking if there are some changes to release: ${error.message}`);
    }
  }

  if (!isEmpty) {
    console.info('There are some changes to release. Creating release...');
    try {
      await new Promise<void>((resolve, reject) =>
        exec('npx commit-and-tag-version', (error) => {
          if (error) {
            reject(error);
          }
          resolve();
        }),
      );

      const pkg = JSON.parse(await readFile('./package.json', 'utf-8'));
      console.info(`Release ${pkg.version} created.`);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error creating release: ${error.message}`);
      }
    }
  } else {
    console.info('No changes to release.');
  }

  console.groupEnd();
}

async function releaseIsEmpty(): Promise<boolean> {
  return new Promise((resolve, reject) => {
    exec('npx commit-and-tag-version --dry-run', (error, stdout) => {
      if (error) {
        reject(error);
      }
      resolve(!/^\#\#\#/m.test(stdout));
    });
  });
}
