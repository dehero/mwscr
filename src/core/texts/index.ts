import { commonTexts } from './common-texts.js';
import { fieldTexts } from './field-texts.js';
import { locationTexts } from './location-texts.js';
import { metricsTexts } from './metrics-texts.js';
import { postFilterTexts } from './post-filter-texts.js';
import { postTexts } from './post-texts.js';
import { postViolationTexts } from './post-violation-texts.js';
import { postsManagerTexts } from './posts-manager-texts.js';
import { userFilterTexts } from './user-filter-texts.js';
import { userTexts } from './user-texts.js';

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
