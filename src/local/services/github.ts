export const id = 'gh';
export const name = 'GitHub';

export function getUserProfileUrl(profileId: string) {
  return `https://github.com/${profileId}`;
}
