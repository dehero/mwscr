import type { JSX } from 'solid-js';

export function isJSXElementEmpty(element: JSX.Element) {
  return !element || (Array.isArray(element) && element.filter(Boolean).length === 0);
}
