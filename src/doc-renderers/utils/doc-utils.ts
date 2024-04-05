import esc from 'escape-html';
import type { Doc } from '../../entities/doc.js';
import { relativeUrl } from './url-utils.js';

export function renderNavs(navs: Array<Doc[]>, filename: string): string[] {
  const lines: string[] = [];

  if (navs.length > 0) {
    lines.push(
      navs
        .map((nav, navIndex) =>
          nav
            .map((doc) =>
              (
                navIndex < navs.length - 1
                  ? filename.startsWith(doc.filename.replace(/\/index\.md$/, '/'))
                  : doc.filename === filename
              )
                ? `\`${esc(doc.linkText.toString())}\``
                : `[\`${esc(doc.linkText.toString())}\`](${esc(relativeUrl(filename, doc.filename))})`,
            )
            .join(' '),
        )
        .join('\n\n'),
    );
    lines.push('');
  }

  return lines;
}
