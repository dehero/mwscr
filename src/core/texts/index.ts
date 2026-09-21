import { commonTexts } from './common-texts.ts';
import { fieldTexts } from './field-texts.ts';
import { locationTexts } from './location-texts.ts';
import { metricsTexts } from './metrics-texts.ts';
import { postFilterTexts } from './post-filter-texts.ts';
import { postTexts } from './post-texts.ts';
import { postViolationTexts } from './post-violation-texts.ts';
import { postsManagerTexts } from './posts-manager-texts.ts';
import { userFilterTexts } from './user-filter-texts.ts';
import { userTexts } from './user-texts.ts';

export const texts = {
  common: commonTexts,
  field: fieldTexts,
  location: locationTexts,
  metrics: metricsTexts,
  post: postTexts,
  postFilter: postFilterTexts,
  postViolation: postViolationTexts,
  postsManager: postsManagerTexts,
  user: userTexts,
  userFilter: userFilterTexts,
} as const;
