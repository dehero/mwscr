const MARKDOWN_LINK_REGEX = /\[([^\]]+)\]\(([^)]+)\)/gm;
const MARKDOWN_DOUBLE_BR_REGEX = /(?:\r?\n){2}/gm;
const MARKDOWN_BR_REGEX = /\s\s$/gm;
const MARKDOWN_TITLE_REGEX = /#\s*(.*)/m;

export type MarkdownLinkDescriptor = [href?: string, external?: boolean];

export type MarkdownLinkReplacer = (url: string) => MarkdownLinkDescriptor;

export function markdownToHtml(markdown: string, linkReplacer?: MarkdownLinkReplacer) {
  let title;
  const html = markdown
    .replace(MARKDOWN_TITLE_REGEX, (_, match) => {
      title = match;
      return '';
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
