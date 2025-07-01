import childProcess from 'child_process';
import util from 'util';
import type { UserProfile } from '../../core/entities/user.js';
import { isUserProfileEqual, mergeUserProfiles } from '../../core/entities/user.js';
import { github } from '../../core/services/github.js';

type ProfileCommits = [profile: UserProfile, commits: number];

export const exec = util.promisify(childProcess.exec);

export async function importCommitAuthors() {
  console.group('Importing commit authors...');

  try {
    const entries = await getAuthorCommits();
    const profiles: ProfileCommits[] = [];

    for (const [profile, commits] of entries) {
      const existingProfile = profiles.find((p) => isUserProfileEqual(p, profile));
      if (existingProfile) {
        mergeUserProfiles(existingProfile, [profile]);
      }
    }

    // const profile = github.parseCommitAuthor(contributor);

    // const [user] = await users.mergeOrAddItem({ commits, profiles: [profile] });

    // console.log(`Imported ${commits} commits from ${username}.`);

    // await users.save();
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error importing commit authors: ${error.message}`);
    }
  }

  console.groupEnd();
}

async function getAuthorCommits(): Promise<Array<ProfileCommits>> {
  const { stdout } = await exec('git shortlog --summary --numbered --email', { encoding: 'buffer' });

  return new TextDecoder()
    .decode(stdout)
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [commits, contributor] = line.toString().split('\t');
      const profile = github.parseCommitAuthor(String(contributor));

      return [profile, Number(commits)];
    });
}
