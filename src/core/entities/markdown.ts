const MARKDOWN_LINK_LINE_REGEX = /^[^\S\r\n]*\[([^\]]+)\]\(([^)]+)\)[^\S\r\n]*$/gm;
const MARKDOWN_LINK_REGEX = /\[([^\]]+)\]\(([^)]+)\)/gm;
const MARKDOWN_IMAGE_REGEX = /!\[([^\]]*)\]\(([^)]+)\)/gm;
const MARKDOWN_DOUBLE_BR_REGEX = /(?:\r?\n){2}/gm;
const MARKDOWN_BR_REGEX = /\s\s$/gm;
const MARKDOWN_HTML_BR_REGEX = /<br\s*\/?>/gm;
const MARKDOWN_TITLE_REGEX = /^#\s*(.*)/m;
const MARKDOWN_PARAGRAPH_BREAK = /(\S)[^\S\r\n]?\n[^\S\r\n]*(\S)/gm;
const MARKDOWN_TABLE_ROW_REGEX = /^\s*\|.*\|\s*$/;
const MARKDOWN_TABLE_SEPARATOR_CELL_REGEX = /^\s*:?-{1,}:?\s*$/;
const MARKDOWN_CODE_FENCE_REGEX = /^[^\S\r\n]*```/;
const MARKDOWN_INLINE_CODE_REGEX = /`([^`\n]+)`/g;
const MARKDOWN_CODE_PLACEHOLDER_REGEX = /\uE000(\d+)\uE001/g;

export type MarkdownLinkDescriptor = [href?: string, external?: boolean];

export type MarkdownLinkReplacer = (url: string) => MarkdownLinkDescriptor;

type MarkdownTableAlignment = 'left' | 'center' | 'right' | undefined;

function splitMarkdownTableRow(line: string) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

function getMarkdownTableAlignment(cell: string): MarkdownTableAlignment {
  const trimmed = cell.trim();
  const left = trimmed.startsWith(':');
  const right = trimmed.endsWith(':');

  if (left && right) {
    return 'center';
  }

  if (right) {
    return 'right';
  }

  if (left) {
    return 'left';
  }

  return undefined;
}

function isMarkdownTableSeparator(line: string) {
  if (!line.includes('-')) {
    return false;
  }

  const cells = splitMarkdownTableRow(line);

  return cells.length > 0 && cells.every((cell) => MARKDOWN_TABLE_SEPARATOR_CELL_REGEX.test(cell));
}

function renderMarkdownTableCell(tag: 'th' | 'td', content: string, alignment: MarkdownTableAlignment) {
  const style = alignment ? ` style="text-align: ${alignment}"` : '';

  return `<${tag}${style}>${content}</${tag}>`;
}

function replaceMarkdownTables(markdown: string) {
  const lines = markdown.split('\n');
  const result: string[] = [];
  let index = 0;

  while (index < lines.length) {
    const headerLine = lines[index];
    const separatorLine = lines[index + 1];

    if (
      headerLine !== undefined &&
      separatorLine !== undefined &&
      MARKDOWN_TABLE_ROW_REGEX.test(headerLine) &&
      isMarkdownTableSeparator(separatorLine)
    ) {
      const headerCells = splitMarkdownTableRow(headerLine);
      const alignments = splitMarkdownTableRow(separatorLine).map(getMarkdownTableAlignment);
      const rows: string[][] = [];
      let rowIndex = index + 2;

      while (rowIndex < lines.length) {
        const rowLine = lines[rowIndex];

        if (rowLine === undefined || !MARKDOWN_TABLE_ROW_REGEX.test(rowLine)) {
          break;
        }

        rows.push(splitMarkdownTableRow(rowLine));
        rowIndex++;
      }

      const head = `<thead><tr>${headerCells
        .map((cell, cellIndex) => renderMarkdownTableCell('th', cell, alignments[cellIndex]))
        .join('')}</tr></thead>`;
      const body = rows.length
        ? `<tbody>${rows
            .map(
              (cells) =>
                `<tr>${cells
                  .map((cell, cellIndex) => renderMarkdownTableCell('td', cell, alignments[cellIndex]))
                  .join('')}</tr>`,
            )
            .join('')}</tbody>`
        : '';

      result.push(`<table>${head}${body}</table>`);
      index = rowIndex;
    } else {
      result.push(headerLine ?? '');
      index++;
    }
  }

  return result.join('\n');
}

function escapeCodeHtml(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function replaceMarkdownCodeBlocks(markdown: string, createPlaceholder: (html: string) => string) {
  const lines = markdown.split('\n');
  const result: string[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (line !== undefined && MARKDOWN_CODE_FENCE_REGEX.test(line)) {
      const code: string[] = [];
      let endIndex = index + 1;

      while (endIndex < lines.length && !MARKDOWN_CODE_FENCE_REGEX.test(lines[endIndex] ?? '')) {
        code.push(lines[endIndex] ?? '');
        endIndex++;
      }

      result.push(createPlaceholder(`<pre><code>${escapeCodeHtml(code.join('\n'))}</code></pre>`));
      index = endIndex < lines.length ? endIndex + 1 : endIndex;
    } else {
      result.push(line ?? '');
      index++;
    }
  }

  return result.join('\n');
}

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

export function markdownToHtml(markdown: string, linkReplacer?: MarkdownLinkReplacer) {
  let title;
  const codeHtml: string[] = [];
  const createCodePlaceholder = (html: string) => `\uE000${codeHtml.push(html) - 1}\uE001`;

  const source = replaceMarkdownCodeBlocks(
    markdown.replace(MARKDOWN_TITLE_REGEX, (_, match) => {
      title = match;
      return '';
    }),
    createCodePlaceholder,
  ).replaceAll(MARKDOWN_INLINE_CODE_REGEX, (_, code) => createCodePlaceholder(`<code>${escapeCodeHtml(code)}</code>`));

  const html = replaceMarkdownTables(source)
    .replaceAll(MARKDOWN_IMAGE_REGEX, (_, alt, url) => `<img src="${url}" alt="${alt}" />`)
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
    .replaceAll(MARKDOWN_BR_REGEX, '<br />')
    .replaceAll('<br /><br /><table>', '<br /><table>')
    .replaceAll('</table><br /><br />', '</table><br />')
    .replaceAll(MARKDOWN_CODE_PLACEHOLDER_REGEX, (_, index) => codeHtml[Number(index)] ?? '')
    .replaceAll('<br /><br /><pre>', '<br /><pre>')
    .replaceAll('</pre><br /><br />', '</pre><br />');

  return { html, title };
}

export function markdownToTelegramHtml(markdown: string) {
  let title;
  const html = markdown
    .replace(MARKDOWN_TITLE_REGEX, (_, match) => {
      title = match;
      return '';
    })
    .replaceAll(MARKDOWN_LINK_REGEX, (_, title, url) => {
      return url ? `<a href="${url}">${title}</a>` : title;
    })
    .trim()
    .replaceAll(MARKDOWN_DOUBLE_BR_REGEX, '\n\n')
    .replaceAll(MARKDOWN_BR_REGEX, '\n');

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
