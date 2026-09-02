import { createSignal, type JSX } from 'solid-js';
import type {
  IntlText,
  IntlTextPrimitiveValues,
  IntlTextResult,
  IntlTextValues,
  Locale,
} from '../../core/entities/intl.js';
import { site } from '../../core/services/site.js';
import { localize as coreLocalize } from '../../core/utils/intl-utils.js';

const isProduction = import.meta.env.MODE === 'production';

function localeFromStorage(): Locale | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const locale = window.localStorage.getItem('locale');

  return locale === 'ru' || locale === 'en-GB' ? locale : undefined;
}

function localeFromCurrentOrigin(): Locale {
  return site.origin === site.originRu ? 'ru' : 'en-GB';
}

const [locale, setLocale] = createSignal<Locale>(
  !isProduction ? localeFromStorage() || localeFromCurrentOrigin() : localeFromCurrentOrigin(),
);

export function currentLocale(): Locale {
  return locale();
}

export function switchLocale() {
  const nextLocale: Locale = isRu() ? 'en-GB' : 'ru';
  setLocale(nextLocale);

  if (!isProduction) {
    window.localStorage.setItem('locale', nextLocale);
  }
}

export function isRu() {
  return currentLocale() === 'ru';
}

export function getCurrentSiteOrigin() {
  return site.origin;
}

export function getOtherSiteOrigin() {
  return site.origin === site.originRu ? site.originEn : site.originRu;
}

export function getLocaleSwitchUrl() {
  if (!isProduction) {
    return undefined;
  }

  if (typeof window === 'undefined') {
    return getOtherSiteOrigin();
  }

  return `${getOtherSiteOrigin()}${window.location.pathname}${window.location.search}${window.location.hash}`;
}

export function localize(localText: string | IntlText | undefined, invert?: boolean): string;
export function localize(
  intlText: string | IntlText | undefined,
  values?: IntlTextPrimitiveValues,
  invert?: boolean,
): string;
export function localize<T = JSX.Element>(
  intlText: string | IntlText | undefined,
  values?: IntlTextValues<T>,
  invert?: boolean,
): IntlTextResult<T>;
export function localize<T = JSX.Element>(
  intlText: string | IntlText | undefined,
  valuesOrInvert: IntlTextValues<T> | boolean = false,
  invert = false,
) {
  if (typeof intlText === 'string') {
    return intlText;
  }

  return typeof valuesOrInvert === 'boolean'
    ? coreLocalize(intlText, currentLocale(), valuesOrInvert)
    : coreLocalize(intlText, currentLocale(), valuesOrInvert, invert);
}

export function localField<K extends string, T extends { [P in K | `${K}Ru`]?: string }>(
  obj: T | undefined,
  fieldName: K,
  invert = false,
): string | undefined {
  if (!obj) {
    return undefined;
  }

  const useRuPostfix = invert ? !isRu() : isRu();

  const key = useRuPostfix ? (`${fieldName}Ru` as const) : fieldName;

  return obj[key] || obj[fieldName];
}
