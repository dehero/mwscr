import { capitalizeFirstLetter, textToId } from '../utils/common-utils.js';

const POST_TITLE_LOWERCASE_WORDS = [
  'a',
  'an',
  'by',
  'of',
  'on',
  'and',
  'the',
  'vs',
  'to',
  'in',
  'at',
  'or',
  'for',
  'from',
  'with',
  's',
  't',
  'd',
  'ruhn',
];

export function postNameFromTitle(title: string) {
  return textToId(title).replace('drawn-by', 'by');
}

export function postTitleFromString(value: string) {
  return value
    .replace(/[^A-Za-z0-9',\-\.\:\+\"!?]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,\.\:!?])/g, '$1')
    .trim()
    .split(/([^A-Za-z0-9]+)?([A-Za-z0-9]+)/g)
    .filter((item) => Boolean(item))
    .map((item, index, array) => {
      const lowerCaseItem = item.toLocaleLowerCase();
      const prevItem = array[index - 1];
      const nextItem = array[index + 1];

      if (
        index > 0 &&
        (index < array.length - 1 || prevItem === "'" || prevItem === '-') &&
        !nextItem?.startsWith('-') &&
        !(nextItem?.startsWith('.') && item.length === 1) && // Skip initials
        POST_TITLE_LOWERCASE_WORDS.includes(lowerCaseItem)
      ) {
        return lowerCaseItem;
      }
      return capitalizeFirstLetter(item.toLocaleLowerCase());
    })
    .join('');
}
