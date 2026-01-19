import type { PostsManagerName, PublicPostsManagerName } from '../entities/posts-manager.js';
// import { PUBLICATION_IS_RECENT_DAYS } from '../entities/publication.js';
import type { PostCandidateRule } from '../rules/post-candidate-rules.js';
import {
  //   // needAnnouncement,
  // needMaxMarkDistance,
  // needMinAuthorDistance,
  needMinContentDistance,
  needMinMarkDistance,
  needMinRelatedLocationDistance,
  needMinThirdPartyDistance,
  needMinTypeDaysAgo,
  needMinTypeDistance,
} from '../rules/post-candidate-rules.js';
import { needCertainType } from '../rules/post-rules.js';
import type { PostingRule } from '../rules/posting-rules.js';
import { afterHour, lastPostedDaysAgo } from '../rules/posting-rules.js';

export interface PostingScenario {
  title: string;
  sourceManagers: PostsManagerName[];
  targetManager: PublicPostsManagerName;
  postingRules: PostingRule[];
  postCandidateRules: PostCandidateRule[];
}

// const announcedPost: PostingScenario = {
//   title: 'announced post',
//   sourceManagers: ['drafts'],
//   targetManager: 'posts',
//   postingRules: [afterHour(18), lastPostedDaysAgo(1)],
//   postCandidateRules: [needAnnouncement],
// };

// const announcedExtra: PostingScenario = {
//   title: 'announced extra',
//   sourceManagers: ['drafts'],
//   targetManager: 'extras',
//   postingRules: [afterHour(9)],
//   postCandidateRules: [needAnnouncement],
// };

const news: PostingScenario = {
  title: 'news',
  sourceManagers: ['drafts'],
  targetManager: 'extras',
  postingRules: [afterHour(9)],
  postCandidateRules: [needCertainType('news')],
};

const achievement: PostingScenario = {
  title: 'achievement',
  sourceManagers: ['drafts'],
  targetManager: 'extras',
  postingRules: [afterHour(9)],
  postCandidateRules: [needCertainType('achievement')],
};

const redrawing: PostingScenario = {
  title: 'redrawing',
  sourceManagers: ['drafts'],
  targetManager: 'extras',
  postingRules: [afterHour(9)],
  postCandidateRules: [needCertainType('redrawing'), needMinTypeDaysAgo(7)],
};

const shot: PostingScenario = {
  title: 'shot',
  sourceManagers: ['drafts', 'posts'],
  targetManager: 'posts',
  postingRules: [afterHour(18), lastPostedDaysAgo(1)],
  postCandidateRules: [
    needCertainType('shot'),
    needMinMarkDistance('C', 14),
    needMinMarkDistance('B2', 4),
    needMinMarkDistance('A2', 1),
    // needMaxMarkDistance('A2', 7),
    needMinMarkDistance('A1', 7),
    // needMaxMarkDistance('A1', 21),
    // needMinAuthorDistance(1),
    needMinContentDistance(365),
    needMinRelatedLocationDistance(2),
    needMinThirdPartyDistance(7),
  ],
};

const shotSet: PostingScenario = {
  title: 'shot-set',
  sourceManagers: ['drafts'],
  targetManager: 'posts',
  postingRules: [afterHour(18), lastPostedDaysAgo(1)],
  postCandidateRules: [
    needCertainType('shot-set'),
    needMinTypeDistance(7),
    needMinContentDistance(91),
    needMinThirdPartyDistance(7),
  ],
};

const wallpaper: PostingScenario = {
  title: 'wallpaper',
  sourceManagers: ['drafts'], // 'posts'],
  targetManager: 'posts',
  postingRules: [afterHour(18), lastPostedDaysAgo(1)],
  postCandidateRules: [
    needCertainType('wallpaper', 'wallpaper-v'),
    // needMinTypeDistance(7),
    needMinTypeDistance(1),
    needMinContentDistance(365),
    needMinThirdPartyDistance(7),
  ],
};

export const postingScenarios: PostingScenario[] = [
  // announcedPost,
  // announcedExtra,
  news,
  achievement,
  wallpaper,
  shotSet,
  shot,
  redrawing,
];
