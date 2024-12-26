import type { PostCandidateRule } from '../rules/post-candidate-rules.js';
import {
  needMaxMarkDistance,
  needMinAuthorDistance,
  needMinContentDistance,
  needMinMarkDistance,
  needMinRelatedLocationDistance,
  needMinTypeDistance,
} from '../rules/post-candidate-rules.js';
import { needCertainType } from '../rules/post-rules.js';
import type { PostingRule } from '../rules/posting-rules.js';
import { afterHour, lastPostedDaysAgo, lastPublishedHoursAgo, onWeekDay } from '../rules/posting-rules.js';

export type PostingScenario = [title: string, postingRules: PostingRule[], postCandidateRules: PostCandidateRule[]];

// const shotSet: PostingScenario = [
//   'set of shots on Sunday',
//   [onWeekDay(0), afterHour(6), lastPostedHoursAgo(12), lastPostedDaysAgo(1)],
//   [needCertainType('shot-set'), needMinTypeDistance(7), needMinContentDistance(91)],
// ];

const shot: PostingScenario = [
  'shot',
  [afterHour(18), lastPublishedHoursAgo(12), lastPostedDaysAgo(1)],
  [
    needCertainType('shot'),
    needMinMarkDistance('C', 14),
    needMinMarkDistance('B2', 4),
    needMinMarkDistance('A2', 1),
    needMaxMarkDistance('A2', 7),
    needMinMarkDistance('A1', 7),
    needMaxMarkDistance('A1', 21),
    needMinAuthorDistance(1),
    needMinContentDistance(365),
    needMinRelatedLocationDistance(2),
  ],
];

const wallpaper: PostingScenario = [
  'wallpaper',
  [onWeekDay(2), afterHour(18), lastPublishedHoursAgo(12), lastPostedDaysAgo(1)],
  [needCertainType('wallpaper', 'wallpaper-v'), needMinTypeDistance(14), needMinContentDistance(365)],
];

export const postingScenarios: PostingScenario[] = [wallpaper, /*shotSet*/ shot];
