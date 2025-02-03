// import { users } from './data-managers/users.js';

import { posts } from './data-managers/posts.js';

// const dehero1 = await users.addItem({}, 'dehero1');

// dehero1.profiles = { tg: 'CHEHCH' };

// dehero1.profiles.tg = 'CHEHCH2';

// console.log('TEST', await users.getItem('dehero1'));

// console.log(JSON.stringify(dehero1), users.getLocalPatch());

// // await users.save();

const item = await posts.getItem('2016-11-20-1-dren-plantation');

console.log(item);

item?.posts?.push({
  service: 'tg',
  id: 1,
  published: new Date(),
});

console.log(posts.patch);

await posts.save();
