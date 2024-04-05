import type { Resource } from '../entities/resource.js';
import type { Rule } from '../entities/rule.js';
import { listItems } from '../utils/common-utils.js';

export type ResourceRule = Rule<Resource>;

export function needCertainMimeType(mimeTypes: string[]) {
  return (resource: Resource): resource is Resource => {
    const [, mimeType] = resource;
    if (!mimeType || !mimeTypes.includes(mimeType)) {
      throw new Error(`need mime type ${listItems(mimeTypes, true)}, got "${mimeType}"`);
    }
    return true;
  };
}

export function needMinSize(minSize: number) {
  return (resource: Resource): resource is Resource => {
    const [data] = resource;
    if (data.length < minSize) {
      throw new Error(`need min size ${minSize}, got ${data.length}`);
    }
    return true;
  };
}

export function needMaxSize(maxSize: number) {
  return (resource: Resource): resource is Resource => {
    const [data] = resource;
    if (data.length > maxSize) {
      throw new Error(`need max size ${maxSize}, got ${data.length}`);
    }
    return true;
  };
}
