import { resolveRoute } from 'vike/routing';
import { helpRoute } from '../../routes/help-route.js';

interface Topic {
  title: string;
  text: string;
}

interface TopicInfo {
  title: string;
  html: string;
  topicIds: string[];
}

export const topics: Map<string, Topic> = new Map([
  [
    '',
    {
      title: '',
      text: "Here you can find information about [Morrowind Screenshots](/help/mwscr/) project and it's [goals](/help/goal/).",
    },
  ],
  [
    'mwscr',
    {
      title: 'Morrowind Screenshots',
      text: `
        Original screenshots and videos from [The Elder Scrolls III: Morrowind](/help/morrowind/). No
        third-party mods. No color filters. No interface.
        `,
    },
  ],
  [
    'goal',
    {
      title: "project's goal",
      text: `
        The goal of the project is to seek out the hidden beauty and celebrate the visual aesthetics of
        [Morrowind](/help/morrowind/), a computer game from [Bethesda Softworks](https://elderscrolls.bethesda.net/en/morrowind).
        Most of the content is created using the [OpenMW](https://openmw.org/) open source engine.
      `,
    },
  ],
  [
    'morrowind',
    {
      title: 'Morrowind',
      text: `A computer game from [Bethesda Softworks](https://elderscrolls.bethesda.net/en/morrowind).`,
    },
  ],
]);

export function createTopicInfo(topic: Topic | undefined): TopicInfo | undefined {
  if (!topic) {
    return undefined;
  }

  const topicIds: string[] = [];

  const html = topic.text.replaceAll(/\[([^\]]+)\]\(([^)]+)\)/gm, (_, title, href) => {
    const external = !href.startsWith('/');
    if (!external) {
      const { match, routeParams } = resolveRoute(helpRoute.path, href);
      if (match) {
        const topicId = routeParams['*']?.replace(/\/$/, '');
        if (topicId) {
          topicIds.push(topicId);
        }
      }
    }
    return `<a href="${href}"${external ? ' target="_blank"' : ''}>${title}</a>`;
  });

  return { title: topic.title, html, topicIds };
}
