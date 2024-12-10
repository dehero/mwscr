import type { Topic } from '../../../core/entities/topic.js';

export interface HelpPageData {
  topics: Record<string, Topic>;
}
