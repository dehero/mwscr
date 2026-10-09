import { readFile, writeFile } from 'fs/promises';
import prettier from 'prettier';
import { renderTopicGuide, type TopicGuideOrderNode } from '../../core/entities/topic-guide.ts';
import { site } from '../../core/services/site.ts';
import { readTopicSources } from '../data-managers/topics.ts';

const FILENAMES = {
  en: 'CONTRIBUTING.md',
  ru: 'CONTRIBUTING.ru.md',
} as const;

/**
 * Deterministic structure of the contributing guidelines. Nesting defines
 * heading levels, order defines section placement. Topics missing from this
 * list are appended alphabetically at the end of the document.
 */
const CONTRIBUTING_ORDER: TopicGuideOrderNode[] = [
  {
    id: 'mwscr',
    children: [{ id: 'posts' }, { id: 'extras' }, { id: 'trash' }],
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
      { id: 'drafts' },
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

export async function createContributing() {
  console.group('Creating contributing guidelines...');

  try {
    const sources = await readTopicSources();

    for (const language of ['en', 'ru'] as const) {
      const filename = FILENAMES[language];
      const content = await formatMarkdown(
        filename,
        renderTopicGuide(
          sources,
          language,
          { enFilename: FILENAMES.en, ruFilename: FILENAMES.ru, enOrigin: site.originEn, ruOrigin: site.originRu },
          CONTRIBUTING_ORDER,
        ),
      );

      if ((await readExisting(filename)) === content) {
        console.info(`"${filename}" is up to date.`);
        continue;
      }

      await writeFile(filename, content, 'utf-8');
      console.info(`Created "${filename}".`);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error creating contributing guidelines: ${error.message}`);
    }
  }

  console.groupEnd();
}

async function formatMarkdown(filename: string, markdown: string) {
  const options = await prettier.resolveConfig(filename);

  return prettier.format(markdown, { ...options, parser: 'markdown', endOfLine: 'lf' });
}

async function readExisting(filename: string) {
  try {
    return (await readFile(filename, 'utf-8')).replace(/\r\n/g, '\n');
  } catch {
    return undefined;
  }
}
