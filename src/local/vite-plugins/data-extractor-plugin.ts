import toSource from 'tosource';
import type { Plugin } from 'vite';
import { POSTS_MANAGER_INFOS } from '../../core/entities/posts-manager.js';
import { dataExtractor } from '../data-managers/extractor.js';

const virtualModulesRegex = /^\0?virtual:(locationInfos|postInfos|userInfos)(?:\?(.*))?$/;

export function dataExtractorPlugin(): Plugin {
  return {
    name: 'mwscr:virtual-modules',
    resolveId(id) {
      if (virtualModulesRegex.test(id)) {
        return `\0${id}`;
      }
      return undefined;
    },
    async load(id) {
      const [, virtualModuleId, query] = virtualModulesRegex.exec(id) ?? [];

      if (!virtualModuleId) {
        return null;
      }

      let data;
      const searchParams = new URLSearchParams(query || '');

      switch (virtualModuleId) {
        case 'locationInfos':
          data = await dataExtractor.getAllLocationInfos();
          break;
        case 'postInfos': {
          const managerName =
            POSTS_MANAGER_INFOS.find(({ id }) => id === searchParams.get('managerName'))?.id || 'posts';
          data = await dataExtractor.getAllPostInfos(managerName);
          break;
        }
        case 'userInfos':
          data = await dataExtractor.getAllUserInfos();
          break;
        default:
          return null;
      }

      // @ts-expect-error No proper typing for toSource
      return `const data = ${toSource(data)};\nexport default data;`;
    },
  };
}
