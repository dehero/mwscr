import { load } from 'js-yaml';
import toSource from 'tosource';
import type { Plugin } from 'vite';
// TODO: move schema outside data-managers
import { YAML_SCHEMA } from '../data-managers/utils/yaml.js';

const yamlExtension = /\.ya?ml(\?.*)?$/;

export function importYamlPlugin(): Plugin {
  return {
    name: 'vite:transform-yaml',

    async transform(code: string, id: string) {
      if (!yamlExtension.test(id)) {
        return null;
      }

      const searchParams = new URLSearchParams(id.split('?')[1] || '');
      const transform = searchParams.get('transform');

      const data = load(code, {
        filename: id,
        schema: YAML_SCHEMA,
        onWarning: (warning) => console.warn(warning.toString()),
      });

      // eslint-disable-next-line sonarjs/no-small-switch
      switch (transform) {
        case 'postInfo':
          transformPostInfo(data);
          break;
        default:
      }

      return {
        // @ts-expect-error No proper typing
        code: `const data = ${toSource(data)};\nexport default data;`,
        map: { mappings: '' },
      };
    },
  };
}

function transformPostInfo(data: unknown) {
  if (typeof data !== 'object' || data === null) {
    throw new Error(`Need object`);
  }

  for (const _entry of Object.entries(data)) {
    // TODO: use createPostInfo
  }
}
