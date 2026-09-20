import 'dotenv/config';
import { renderCalendarToFolder } from './renderers/calendars.js';

// await renderCalendarToFolder({
//   folder: '.temp/2026',
//   year: 2026,
//   ru: true,
//   images: [
//     'store:/shots/2018-02-21-view-from-the-coastal-rocks.png', // Месяц Утренней Звезды
//     'store:/shots/2016-12-28-close-to-caldera-clothier.png', // Месяц Восхода
//     'store:/shots/2017-03-16-in-the-chambers-of-nchurdamz.png', // Месяц Первоцвета
//     'store:/shots/2017-01-06-daedroth-in-grazelands.png', // Месяц Дождя
//     'store:/shots/2016-12-20-a-boxy-nightstand.png', // Месяц Сева
//     'store:/shots/2018-09-22-two-ways.png', // Месяц Середины Года
//     'store:/shots/2018-08-20-mushroom-glade.png', // Месяц Солнцеворота
//     'store:/shots/2018-08-27-coming-to-gnaar-mok.png', // Месяц Урожая
//     'store:/shots/2017-04-26-divine-pentagon.png', // Месяц Огня
//     'store:/shots/2018-06-29-road-to-a-dwemer-tower.png', // Месяц Мороза
//     'store:/shots/2017-02-03-hlaalu-council-manor.png', // Месяц Заката
//     'store:/shots/2018-11-09-dusk-in-the-skaal-village.png', // Месяц Вечерней Звезды
//   ],
// });

await renderCalendarToFolder({
  folder: '.temp/2027',
  year: 2027,
  ru: true,
  images: [
    'store:/shots/2024-12-30-cold-rain-of-bitter-coast.png', // Месяц Утренней Звезды
    'store:/shots/2018-11-28-landing.png', // Месяц Восхода
    'store:/shots/2018-03-12-mushroom-arch.png', // Месяц Первоцвета
    'store:/shots/2019-03-04-evening-road.png', // Месяц Дождя
    'store:/shots/2018-11-11-through-the-snowy-forest.png', // Месяц Сева
    'store:/shots/2025-03-21-coming-to-ald-sotha.png', // Месяц Середины Года
    'store:/shots/2018-11-11-through-the-snowy-forest.png', // Месяц Солнцеворота
    'store:/shots/2018-11-24-ministry-of-truth.png', // Месяц Урожая
    'store:/shots/2024-12-26-two-houses-on-the-outskirts.png', // Месяц Огня
    'store:/shots/2018-10-24-snowfall-over-the-ice-river.png', // Месяц Мороза
    'store:/shots/2022-08-02-dark-spells.png', // Месяц Заката
    'store:/shots/2024-03-02-queue.png', // Месяц Вечерней Звезды
  ],
});

// От подписчиков

// 'store:/shots/2016-11-21-sheogorad.png',
// 'store:/shots/2017-10-04-in-the-evening-time.png',
// 'store:/shots/2018-03-12-mushroom-arch.png',
// 'store:/shots/2018-09-07-red-light.png',
// 'store:/shots/2018-10-24-snowfall-over-the-ice-river.png',
// 'store:/shots/2019-03-04-evening-road.png',

// Варианты

// 2025-03-13-cold-beach.png
// 2020-05-19-night-guard.png
// 2018-12-02-three-imperial-dragons.png
// 2024-12-05-in-the-evening-at-census-and-excise-office.png
// 2017-10-04-in-the-evening-time.png
// 2024-04-15-night-at-red-mountain.png
// 2026-01-06-1-a-small-victory.png
// 2024-12-31-a-look-into-the-darkness.png
// 2024-12-30-cold-rain-of-bitter-coast.png
// 2024-12-26-two-houses-on-the-outskirts.png
// 2026-04-14-1-dragon-in-slings.png
// 2024-03-25-bridge-at-ghostfence.png
// 2025-12-30-1-before-the-storm.png
// 2024-03-02-queue.png
// 2022-08-02-dark-spells.png
// 2022-07-19-stillness-of-vivec.png
// 2022-07-03-crossing-the-edge-of-bitter-coast.png
// 2018-11-18-horror-of-the-red-corridor.png
// 2018-11-24-ministry-of-truth.png
