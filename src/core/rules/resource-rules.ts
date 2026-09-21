import type { Resource } from '../entities/resource.ts';
import type { Rule } from '../entities/rule.ts';
import { listItems } from '../utils/common-utils.ts';

export type ResourceRule = Rule<Resource>;

export function needCertainMimeType(mimeTypes: string[]): ResourceRule {
  return (resource: Resource) => {
    const [, mimeType] = resource;
    if (!mimeType || !mimeTypes.includes(mimeType)) {
      return `need mime type ${listItems(mimeTypes, { quote: true })}, got "${mimeType}"`;
    }
    return undefined;
  };
}

export function needMinSize(minSize: number): ResourceRule {
  return (resource: Resource) => {
    const [data] = resource;
    if (data.length < minSize) {
      return `need min size ${minSize}, got ${data.length}`;
    }
    return undefined;
  };
}

export function needMaxSize(maxSize: number): ResourceRule {
  return (resource: Resource) => {
    const [data] = resource;
    if (data.length > maxSize) {
      return `need max size ${maxSize}, got ${data.length}`;
    }
    return undefined;
  };
}
