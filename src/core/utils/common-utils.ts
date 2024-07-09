import slugify from '@sindresorhus/slugify';

export function asArray<T>(value?: T | T[]): T[] {
  return Array.isArray(value) ? value : typeof value !== 'undefined' ? [value] : [];
}

export async function arrayFromAsync<T>(
  source: Iterable<T> | AsyncIterable<T>,
  compareFn?: (a: T, b: T) => number,
  filterFn?: (item: T) => boolean,
  size?: number,
): Promise<T[]> {
  const items: T[] = [];
  for await (const item of source) {
    if (!filterFn || filterFn(item)) {
      items.push(item);
    }

    if (!compareFn && size && items.length >= size) {
      break;
    }
  }
  if (compareFn) {
    return items.sort(compareFn).slice(0, size);
  }
  return items;
}

export function capitalizeFirstLetter(value: string) {
  return value.charAt(0).toLocaleUpperCase() + value.slice(1);
}

export function cleanupUndefinedProps<T extends Record<string, unknown>>(value: T): T {
  Object.keys(value).forEach((key) => value[key] === undefined && delete value[key]);

  return value;
}

export function debounce(callback: (...args: unknown[]) => void, wait: number) {
  let timeoutId: NodeJS.Timeout | undefined;

  return (...args: unknown[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      callback(...args);
    }, wait);
  };
}

export function greatestCommonDivisor(a: number, b: number) {
  if (!b) {
    return a;
  }

  return greatestCommonDivisor(b, a % b);
}

export function groupBy<K, V>(list: Array<V>, keyGetter: (input: V) => K): Map<K, Array<V>> {
  const map = new Map<K, Array<V>>();

  list.forEach((item) => {
    const key = keyGetter(item);
    const collection = map.get(key);
    if (!collection) {
      map.set(key, [item]);
    } else {
      collection.push(item);
    }
  });

  return map;
}

export function listItems(items: string[], quote?: boolean) {
  const parts: string[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i] ?? '';
    const separator = i < items.length - 1 ? ', ' : ' or ';

    if (i > 0) {
      parts.push(separator);
    }
    parts.push(quote ? `"${item}"` : item);
  }

  return parts.join('');
}

export async function randomDelay(max: number, min = 0) {
  return sleep(min + (max - min) * Math.random());
}

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function textToId(value: string, preserveDots?: boolean) {
  return slugify(value, preserveDots ? { preserveCharacters: ['.'] } : undefined).slice(0, 80);
}

export function partition<T>(array: T[], callback: (element: T, index: number, array: T[]) => boolean): [T[], T[]] {
  const trueArray: T[] = [];
  const falseArray: T[] = [];

  for (let i = 0; i < array.length; i++) {
    const element = array[i];
    if (!element) {
      continue;
    }
    if (callback(element, i, array)) {
      trueArray.push(element);
    } else {
      falseArray.push(element);
    }
  }

  return [trueArray, falseArray];
}

export function compareRandomly(): number {
  return Math.random() - 0.5;
}

export function stringToBool(value?: string): boolean | undefined {
  try {
    return Boolean(JSON.parse(value || ''));
  } catch {
    return undefined;
  }
}

export function boolToString(value?: boolean): string | undefined {
  return JSON.stringify(value);
}
