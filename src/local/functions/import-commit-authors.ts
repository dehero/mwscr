import childProcess from 'child_process';
import util from 'util';
import { users } from '../data-managers/users.js';

export const exec = util.promisify(childProcess.exec);

export async function importCommitAuthors() {
  console.group('Importing commit authors...');

  try {
    const entries = await getAuthorCommits();

    for (const [name, commits] of entries) {
      const [userId, user] = await users.mergeItem({ name, commits, profiles: { gh: name } });
      user.commits = commits;
      await users.updateItem(userId);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error importing commit authors: ${error.message}`);
    }
  }

  console.groupEnd();
}

async function getAuthorCommits(): Promise<Array<[name: string, commits: number]>> {
  const { stdout } = await exec('git shortlog -s -n --all', { encoding: 'buffer' });

  return new TextDecoder()
    .decode(stdout)
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [commits, name] = line.toString().split('\t');
      return [String(name), Number(commits)];
    });
}
