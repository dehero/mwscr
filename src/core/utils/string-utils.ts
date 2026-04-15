export function stripEmojis(value: string) {
  return value.replace(
    /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
    '',
  );
}

export function stripHashtags(value: string) {
  return value.replace(/#\S+/g, '');
}

export function stripCommonExtension(value: string) {
  return value.replace(/\.[^/.]{3,4}$/, '');
}

export function addHtmlBreaksToNewLines(value: string) {
  return value.replace(/\r?\n/g, '<br />\n');
}
