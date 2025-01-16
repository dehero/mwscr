import type { Resource } from '../entities/resource.js';
import type { Rule } from '../entities/rule.js';
import { listItems } from '../utils/common-utils.js';

export type ResourceRule = Rule<Resource>;

export function needCertainMimeType(mimeTypes: string[]): ResourceRule {
  return (resource: Resource) => {
    const [, mimeType] = resource;
    if (!mimeType || !mimeTypes.includes(mimeType)) {
      return `need mime type ${listItems(mimeTypes, true)}, got "${mimeType}"`;
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
