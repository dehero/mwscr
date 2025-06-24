export interface Option<T = string> {
  value: T | undefined;
  label?: string;
  image?: string;
}

export const ALL_OPTION = { value: undefined, label: 'All' } as const satisfies Option;
export const EMPTY_OPTION = { value: undefined, label: 'None' } as const satisfies Option;
export const ANY_OPTION = { value: 'any', label: 'Any' } as const satisfies Option;
export const NONE_OPTION = { value: 'none', label: 'None' } as const satisfies Option;
export const YES_OPTION = { value: 'true', label: 'Yes' } as const satisfies Option;
export const NO_OPTION = { value: 'false', label: 'No' } as const satisfies Option;
