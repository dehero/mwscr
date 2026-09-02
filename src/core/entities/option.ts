import { texts } from '../texts/index.js';
import { asArray } from '../utils/common-utils.js';
import type { IntlText } from './intl.js';

export interface Option<T = string> {
  value: T | undefined;
  label?: string | IntlText;
  image?: string;
}

export const ALL_OPTION = { value: undefined, label: texts.common.all } as const satisfies Option;
export const EMPTY_OPTION = { value: undefined, label: texts.common.none } as const satisfies Option;
export const ORIGINAL_OPTION = { value: undefined, label: texts.common.original } as const satisfies Option;
export const ANY_OPTION = { value: 'any', label: texts.common.any } as const satisfies Option;
export const NONE_OPTION = { value: 'none', label: texts.common.none } as const satisfies Option;
export const YES_OPTION = { value: 'true', label: texts.common.yes } as const satisfies Option;
export const NO_OPTION = { value: 'false', label: texts.common.no } as const satisfies Option;
export const ASC_OPTION = { value: 'asc', label: texts.common.asc } as const satisfies Option;
export const DESC_OPTION = { value: 'desc', label: texts.common.desc } as const satisfies Option;

export function getOptionSearchText(option: Option<unknown> | undefined) {
  const label = asArray(option?.label);

  return [
    typeof label[0] === 'string' ? label[0] : undefined,
    typeof label[1] === 'string' ? label[1] : undefined,
    `${option?.value}`,
  ];
}
