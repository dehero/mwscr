import { readFile, writeFile } from 'fs/promises';
import yaml, { Type } from 'js-yaml';
import { PublicationComment } from '../../../core/entities/publication.js';
import { dateToString, stringToDate } from '../../../core/utils/date-utils.js';
import { compressData, decompressData } from '../../utils/data-utils.js';

const YAML_DATE_REGEXP = /^\d{4}-\d{2}-\d{2}(?:-\d{2}-\d{2}-\d{2})?$/;

const orderedKeys = [
  // Post
  'title',
  'titleRu',
  'description',
  'descriptionRu',
  'location',
  'content',
  'trash',
  'type',
  'author',
  'engine',
  'addon',
  'tags',
  'request',
  'reject',
  'mark',
  'violation',
  'posts',

  // Request
  'date',
  'user',
  'text',

  // Publication
  'service',
  'id',
  'code',
  'mediaId',
  'published',
  'updated',
  'followers',
  'likes',
  'views',
  'reposts',
  'comments',

  // User
  'name',
  'nameRu',
  'nameRuFrom',
  'admin',
  'profiles',

  // Location
  'cell',
];

type SerializedComment = [datetime: number, author: string, text: string, ...replies: SerializedComment[]];

export const YAML_SCHEMA = yaml.JSON_SCHEMA.extend({
  implicit: [
    new Type('tag:yaml.org,2002:timestamp', {
      kind: 'scalar',
      resolve: (data) => YAML_DATE_REGEXP.test(data),
      construct: (data) => stringToDate(data),
      instanceOf: Date,
      represent: (data) => dateToString(data as Date, true),
    }),
  ],
  explicit: [
    new Type('!c', {
      kind: 'scalar',
      resolve: (data) => typeof data === 'string',
      construct: (data) => unpackComments(data),
      predicate: (data) => PublicationComment.array().safeParse(data).success,
      represent: (data) => packComments(data as PublicationComment[]),
    }),
  ],
});

function sortKeys(a: unknown, b: unknown) {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return 0;
  }
  return orderedKeys.indexOf(a) - orderedKeys.indexOf(b) || a.localeCompare(b);
}

export async function loadYaml(filename: string): Promise<unknown> {
  const file = await readFile(filename, 'utf-8');
  return yaml.load(file, { schema: YAML_SCHEMA });
}

export function saveYaml(filename: string, data: unknown) {
  const file = yaml.dump(data, {
    lineWidth: 120,
    schema: YAML_SCHEMA,
    sortKeys,
  });

  return writeFile(filename, file);
}

function packComments(comments?: PublicationComment[]): string | undefined {
  if (!comments || typeof comments === 'string') {
    return comments;
  }

  const data: SerializedComment[] = comments.map((comment) => [
    comment.datetime.getTime(),
    comment.author,
    comment.text,
    ...(comment.replies?.map(
      (comment): SerializedComment => [comment.datetime.getTime(), comment.author, comment.text],
    ) || []),
  ]);

  return compressData(data);
}

function unpackComments(value?: string): PublicationComment[] | undefined {
  if (!value) {
    return;
  }

  const data = decompressData<SerializedComment[]>(value);

  return data.map(([datetime, author, text, ...replies]) => ({
    datetime: new Date(datetime),
    author,
    text,
    replies: replies.map(([datetime, author, text]) => ({
      datetime: new Date(datetime),
      author,
      text,
    })),
  }));
}
