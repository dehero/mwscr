import { mergePostTags } from '../core/entities/post.js';
import { posts } from './data-managers/posts.js';

const replace: Array<[string, string | null]> = [
  ['nofilter', null],
  ['arc', 'arch'],
  ['balmora', null],
  ['barrels', 'barrel'],
  ['beasts', 'beast'],
  ['bloodmoon', null],
  ['boats', 'boat'],
  ['books', 'book'],
  ['bottles', 'bottle'],
  ['by Darkness Rifho', null],
  ['by Natty', null],
  ['canals', 'canal'],
  ['candelabra', 'candelabrum'],
  ['candles', 'candle'],
  ['cavern', 'cave'],
  ['doors', 'door'],
  ['drawing', null],
  ['el', null],
  ['fir', 'firtree'],
  ['firtrees', 'firtree'],
  ['fireplace ', 'fireplace'],
  ['fortress', 'fort'],
  ['forts', 'fort'],
  ['giantmushrooms', 'giantmushroom'],
  ['gods', 'god'],
  ['guards', 'guard'],
  ['hills', 'hill'],
  ['houses', 'house'],
  ['interiors', null],
  ['knights', 'knight'],
  ['lanterns', 'lantern'],
  ['lights', 'lantern'],
  ['moons', 'moon'],
  ['mushrooms', 'mushroom'],
  ['naturalarch', 'arch'],
  ['netche', 'netch'],
  ['nightcitylights', 'nightcity'],
  ['nofilter', null],
  ['openmw', null],
  ['opennw', null],
  ['perspectivetricks', 'perspectivetrick'],
  ['potions', 'potion'],
  ['reeds', 'reed'],
  ['roads', 'road'],
  ['rocks', 'rock'],
  ['roots', 'root'],
  ['ruins', 'ruin'],
  ['sandyshores', 'sandyshore'],
  ['screenshots', null],
  ['scrolls', 'scroll'],
  ['sewers', 'sewer'],
  ['shacks', 'shack'],
  ['shadows', 'shadow'],
  ['ships', 'ship'],
  ['shores', 'shore'],
  ['silouettes', 'silouette'],
  ['skirts', 'skirt'],
  ['skulls', 'skull'],
  ['slaves', 'slave'],
  ['snowflakes', 'snowfall'],
  ['stairs', 'stair'],
  ['stars', 'star'],
  ['statues', 'statue'],
  ['stones', 'stone'],
  ['towers', 'tower'],
  ['treasures', 'treasure'],
  ['trees', 'tree'],
  ['urns', 'urn'],
  ['waterreflections', 'waterreflection'],
];

for await (const [, post] of posts.readAllEntries(true)) {
  post.tags = mergePostTags(
    post.tags
      ?.map((tag) => {
        const [, to] = replace.find(([from]) => tag === from) ?? [];
        return typeof to !== 'undefined' ? to : tag;
      })
      .filter((tag): tag is string => typeof tag === 'string'),
  );
}

await posts.save();
