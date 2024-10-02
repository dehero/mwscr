import { load } from 'js-yaml';
import toSource from 'tosource';
import type { Plugin } from 'vite';
// TODO: move schema outside data-managers
import { YAML_SCHEMA } from '../data-managers/utils/yaml.js';

const yamlExtension = /\.ya?ml(\?.*)?$/;

export function importYamlPlugin(): Plugin {
  return {
    name: 'mwscr:import-yaml',

    async transform(code: string, id: string) {
      if (!yamlExtension.test(id)) {
        return null;
      }

      const data = load(code, {
        filename: id,
        schema: YAML_SCHEMA,
        onWarning: (warning) => console.warn(warning.toString()),
      });

      return {
        // @ts-expect-error No proper typing for toSource
        code: `const data = ${toSource(data)};\nexport default data;`,
        map: { mappings: '' },
      };
    },
  };
}
