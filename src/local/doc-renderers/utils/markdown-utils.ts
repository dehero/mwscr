export function renderMarkdownTable<T>(
  columns: string[],
  rows: T[],
  getCell: (row: T | undefined, column: string, index: number) => string | number | undefined,
): string[] {
  const lines: Array<string | number>[] = [
    columns.map((column, index) => getCell(undefined, column, index) || ''),
    columns.map(() => '-'),
    ...rows.map((row, index) => columns.map((column) => getCell(row, column, index) || '')),
  ].filter((line) => line.slice(1).some((cell) => Boolean(cell)));

  const result: string[] = new Array(lines.length);

  for (let i = 0; i < columns.length; i++) {
    const isEmpty = lines.slice(2).every((line) => !line[i]);
    if (isEmpty) {
      continue;
    }

    const maxLength = Math.max(...lines.map((line) => line[i]?.toString().length || 0));
    const isNumber = lines.slice(2).every((line) => typeof line[i] === 'number' || !line[i]);

    for (const [j, line] of lines.entries()) {
      if (j === 1) {
        result[j] = (result[j] || '|') + '-'.repeat(maxLength + 1) + (isNumber ? ':|' : '-|');
      } else {
        const cell = line[i]?.toString();
        result[j] = (result[j] || '| ') + (isNumber ? cell?.padStart(maxLength) : cell?.padEnd(maxLength)) + ' | ';
      }
    }
  }

  return result.map((line) => line.trim());
}
