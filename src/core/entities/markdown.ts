const MARKDOWN_LINK_LINE_REGEX = /^[^\S\r\n]*\[([^\]]+)\]\(([^)]+)\)[^\S\r\n]*$/gm;
const MARKDOWN_LINK_REGEX = /\[([^\]]+)\]\(([^)]+)\)/gm;
const MARKDOWN_DOUBLE_BR_REGEX = /(?:\r?\n){2}/gm;
const MARKDOWN_BR_REGEX = /\s\s$/gm;
const MARKDOWN_HTML_BR_REGEX = /<br\s*\/?>/gm;
const MARKDOWN_TITLE_REGEX = /#\s*(.*)/m;
const MARKDOWN_PARAGRAPH_BREAK = /(\S)[^\S\r\n]?\n[^\S\r\n]*(\S)/gm;

export type MarkdownLinkDescriptor = [href?: string, external?: boolean];

export type MarkdownLinkReplacer = (url: string) => MarkdownLinkDescriptor;

export function markdownToInlineHtml(markdown: string, linkReplacer?: MarkdownLinkReplacer) {
  let title;
  const html = markdown
    .replace(MARKDOWN_TITLE_REGEX, (_, match) => {
      title = match;
      return '';
    })
    .replaceAll(MARKDOWN_LINK_LINE_REGEX, (_, title, url) => {
      const [href, external] = linkReplacer?.(url) ?? [url];

      return href ? `<a href="${href}"${external ? ' target="_blank"' : ''}>${title}</a>  ` : '';
    })
    .replaceAll(MARKDOWN_LINK_REGEX, (_, title, url) => {
      const [href, external] = linkReplacer?.(url) ?? [url];

      return href ? `<a href="${href}"${external ? ' target="_blank"' : ''}>${title}</a>` : title;
    })
    .trim()
    .replaceAll(MARKDOWN_DOUBLE_BR_REGEX, '<br /><br />')
    .replaceAll(MARKDOWN_BR_REGEX, '<br />');

  return { html, title };
}

export function markdownToText(markdown: string, appendlinks?: boolean) {
  let title;
  const links: string[] = [];

  let text = markdown
    .replaceAll(MARKDOWN_HTML_BR_REGEX, '  \n')
    .replaceAll(MARKDOWN_PARAGRAPH_BREAK, '$1 $2')
    .replace(MARKDOWN_TITLE_REGEX, (_, match) => {
      title = match;
      return '';
    })
    .replaceAll(MARKDOWN_LINK_LINE_REGEX, (_, title, url) => {
      if (url) {
        links.push(`${title}: ${url}`);
        return '';
      }
      return title;
    })
    .replaceAll(MARKDOWN_LINK_REGEX, (_, title, url) => {
      links.push(url);
      return title;
    })
    .trim()
    .replaceAll(MARKDOWN_DOUBLE_BR_REGEX, '\n\n')
    .replaceAll(MARKDOWN_BR_REGEX, '\n');

  if (appendlinks && links.length > 0) {
    text += '\n\n' + links.join('\n');
  }

  return { text, title, links };
}
