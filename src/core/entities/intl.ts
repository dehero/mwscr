import { type FormatXMLElementFn, IntlMessageFormat, type PrimitiveType } from 'intl-messageformat';

export type Locale = 'en-GB' | 'ru';

export type IntlText = [en: string, ru?: string];

export type IntlTextPrimitiveValues = Record<string, PrimitiveType>;

export type IntlTextValues<T = never> = Record<string, PrimitiveType | FormatXMLElementFn<T>>;

export type IntlTextResult<T = never> = string | T | Array<string | T>;

const textFormatters = new Map<string, IntlMessageFormat>();

export function getIntlTextFormatter(template: string, locale: Locale) {
  const key = `${locale}\0${template}`;
  const formatter = textFormatters.get(key);

  if (formatter) {
    return formatter;
  }

  const nextFormatter = new IntlMessageFormat(template, locale);
  textFormatters.set(key, nextFormatter);

  return nextFormatter;
}
