import RelateUrl from 'relateurl';
import { pathToFileURL } from 'url';

export function relativeUrl(from: string, to: string) {
  return RelateUrl.relate(pathToFileURL(from).toString(), pathToFileURL(to).toString(), {
    output: RelateUrl.PATH_RELATIVE,
  });
}
