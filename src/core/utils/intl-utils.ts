import type { IntlText, IntlTextPrimitiveValues, IntlTextResult, IntlTextValues, Locale } from '../entities/intl.js';
import { getIntlTextFormatter } from '../entities/intl.js';

export function localize(intlText: IntlText | undefined, locale: Locale, invert?: boolean): string;
export function localize(
  intlText: IntlText | undefined,
  locale: Locale,
  values?: IntlTextPrimitiveValues,
  invert?: boolean,
): string;
export function localize<T>(
  intlText: IntlText | undefined,
  locale: Locale,
  values?: IntlTextValues<T>,
  invert?: boolean,
): IntlTextResult<T>;
export function localize<T = never>(
  intlText: IntlText | undefined,
  locale: Locale,
  valuesOrInvert: IntlTextValues<T> | boolean = false,
  invert = false,
) {
  if (!intlText) {
    return '';
  }

  const values = typeof valuesOrInvert === 'boolean' ? undefined : valuesOrInvert;
  const shouldInvert = typeof valuesOrInvert === 'boolean' ? valuesOrInvert : invert;
  const useRu = shouldInvert ? locale !== 'ru' : locale === 'ru';

  const template = typeof intlText === 'string' ? intlText : intlText[useRu ? 1 : 0] ?? intlText[0];
  const formatter = getIntlTextFormatter(template, locale);

  return formatter.format<T>(values);
}
