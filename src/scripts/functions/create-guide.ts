import { writeFile } from 'fs/promises';
import prettier from 'prettier';
import { topics } from '../data-managers/topics.ts';
import { localize } from '../../core/utils/intl-utils.ts';
import { texts } from '../../core/texts/index.ts';
import { Locale } from '../../core/entities/intl.ts';
import { renderGuide, type GuideOrderNode } from '../renderers/guide.ts';

/**
 * Deterministic structure of the guide topics. Nesting defines
 * heading levels, order defines section placement. Topics missing from this
 * list are appended alphabetically at the end of the document.
 */
const GUIDE_ORDER_NODES: GuideOrderNode[] = [
  {
    id: 'mwscr',
    children: [{ id: 'posts' }, { id: 'extras' }, { id: 'drafts' }, { id: 'trash' }],
  },
  {
    id: 'core-principles',
    children: [{ id: 'no-mods' }, { id: 'no-processing' }, { id: 'no-ui' }],
  },
  {
    id: 'post-types',
    children: [
      { id: 'shot' },
      { id: 'compilation' },
      { id: 'wallpaper' },
      { id: 'clip' },
      { id: 'video' },
      { id: 'redrawing' },
      { id: 'outtakes' },
      { id: 'news' },
      { id: 'photoshop' },
      { id: 'mention' },
      { id: 'merch' },
      { id: 'achievement' },
    ],
  },
  {
    id: 'contributing',
    children: [
      { id: 'proposal' },
      { id: 'creating-compilation' },
      { id: 'request' },
      { id: 'suggesting-location' },
      { id: 'improve-repository' },
    ],
  },
  {
    id: 'members',
    children: [
      { id: 'admin' },
      { id: 'author' },
      { id: 'drawer' },
      { id: 'locator' },
      { id: 'requester' },
      { id: 'commenter' },
      { id: 'follower' },
      { id: 'beginner' },
      { id: 'foreigner' },
    ],
  },
  {
    id: 'shooting-tips',
    children: [
      { id: 'game-engine-and-utilities', children: [{ id: 'openmw' }, { id: 'mge' }] },
      { id: 'aspect-ratio' },
      { id: 'fov' },
      { id: 'distance' },
      { id: 'free-camera' },
      { id: 'god-mode' },
      { id: 'quick-travel' },
      { id: 'player-speed' },
      { id: 'gamehour' },
    ],
  },
  {
    id: 'allowed-mods',
    children: [{ id: 'tamriel-rebuilt' }, { id: 'nofightnohello' }, { id: 'mannequinchallenge' }, { id: 'trackpath' }],
  },
  {
    id: 'editing',
    children: [
      {
        id: 'violations',
        children: [
          { id: 'appropriate-content' },
          { id: 'file-format' },
          { id: 'available-resource' },
          { id: 'vanilla-look' },
          { id: 'anti-aliasing' },
          { id: 'no-jpeg-artifacts' },
          { id: 'no-graphic-issues' },
        ],
      },
      { id: 'merging-posts' },
      { id: 'allowed-processing' },
      {
        id: 'preparing-post',
        children: [
          { id: 'post-title' },
          { id: 'post-author' },
          { id: 'post-tags' },
          { id: 'post-location' },
          { id: 'post-mark' },
        ],
      },
    ],
  },
  { id: 'publication', children: [{ id: 'post-statistics' }, { id: 'post-rating' }, { id: 'contribution' }] },
  { id: 'license' },
  { id: 'morrowind' },
];

export async function createGuide() {
  console.group('Creating guide from help topics...');

  try {
    const entries = await topics.getAllEntries();

    for (const locale of Locale.options) {
      const filename = localize(texts.guide.filename, locale);
      const content = await formatMarkdown(filename, renderGuide(entries, locale, GUIDE_ORDER_NODES));

      await writeFile(filename, content, 'utf-8');
      console.info(`Created "${filename}".`);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error creating guide: ${error.message}`);
    }
  }

  console.groupEnd();
}

async function formatMarkdown(filename: string, markdown: string) {
  const options = await prettier.resolveConfig(filename);

  return prettier.format(markdown, { ...options, parser: 'markdown', endOfLine: 'lf' });
}
