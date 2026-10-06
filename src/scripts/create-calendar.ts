import 'dotenv/config';
import { renderCalendarToFolder } from './renderers/calendars.ts';

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

/**

*/

await renderCalendarToFolder({
  folder: '.temp/2027',
  year: 2027,
  ru: true,
  images: [
    'store:/shots/2018-11-24-ministry-of-truth.png', // Месяц Утренней Звезды
    'store:/shots/2017-05-28-masser-over-the-mournhold-temple.png?align=bottom', // Месяц Восхода
    'store:/shots/2025-03-21-coming-to-ald-sotha.png', // Месяц Первоцвета
    'store:/shots/2018-01-09-dead-trees-of-the-east-coast.png', // Месяц Дождя
    'store:/shots/2017-07-24-modest-comfort.png', // Месяц Сева
    'store:/shots/2018-04-27-playing-tag.png', // Месяц Середины Года
    'store:/shots/2018-01-03-one-more-evening-in-balmora.png', // Месяц Солнцеворота
    'store:/shots/2017-02-04-rumors-are-about-some-two-prisoners.png?align=15%', // Месяц Урожая
    'store:/shots/2017-09-15-lava-swamps.png?align=15%', // Месяц Огня
    'store:/shots/2017-02-10-cold-rain-of-dagon-fel.png', // Месяц Мороза
    'store:/shots/2019-03-04-evening-road.png', // Месяц Заката
    'store:/shots/2018-03-12-mushroom-arch.png?align=15%', // Месяц Вечерней Звезды
  ],
});

// 2025-12-30-1-before-the-storm.png?align=top
// 2017-02-09-climbing-aboard-the-elf-skerring.png
// 2018-04-10-shipping-house.png
// 2024-12-26-two-houses-on-the-outskirts.png
// 2017-10-29-wilted-littoral.png
// 2017-07-11-behind-the-ghostfence.png
// 2017-02-19-first-stars-on-the-quay-of-suran.png?align=top
// 2018-10-16-mournhold-temple.png?align=top
// 2025-04-25-st-delyn-and-masser.png
// 2017-06-28-misty-ledges.png?align=bottom
// 2016-11-20-4-aldruhn-under-skar.png
// 2018-05-30-near-six-fishes.png
// 2017-04-03-gnisis.png
// 2018-05-30-near-six-fishes.png

// Отработано

// 2017-02-19-first-stars-on-the-quay-of-suran.png
// 2018-04-27-playing-tag.png
// 2018-10-16-mournhold-temple.png
// 2020-10-12-evening-lights-of-suran.png?align=bottom
// 2017-09-08-sky-castle.png
// 2017-04-09-deseles-house-of-earthly-delights.png
//
// 2022-07-07-misty-peaks.png
// 2017-07-11-behind-the-ghostfence.png
// 2024-12-30-cold-rain-of-bitter-coast.png
// 2017-08-29-at-the-coast-of-hirstaang-forest.png
// 2018-05-01-view-of-bthanchend.png
// 2017-04-02-night-street-of-balmora.png
// 2018-01-13-coming-to-balmora.png
// 2017-03-26-exploring-bitter-coast.png
// 2017-09-08-sky-castle.png
// 2024-04-22-sunset-over-molag-amur.png
// 2022-08-02-dark-spells.png
// 2025-09-20-1-low-sky-above-mzanchend.png
// 2018-11-11-through-the-snowy-forest.png
// 2016-12-01-arvs-drelen.png
// 2017-03-10-aldruhn-guild-of-mages.png
// 2017-02-20-waterfall-camp.png

// Новые варианты

// await renderCalendarToFolder({
//   folder: '.temp/2028',
//   year: 2028,
//   ru: true,
//   images: [
//     'store:/shots/2017-02-04-rumors-are-about-some-two-prisoners.png',
//     'store:/shots/2017-02-09-climbing-aboard-the-elf-skerring.png',
//     'store:/shots/2017-02-23-surroundings-of-pelagiad.png',
//     'store:/shots/2017-04-02-night-street-of-balmora.png',
//     'store:/shots/2017-04-09-deseles-house-of-earthly-delights.png',
//     'store:/shots/2017-06-22-the-dreamer-is.png',
//     'store:/shots/2017-07-03-in-the-captains-cabin.png',
//     'store:/shots/2017-07-24-modest-comfort.png',
//     'store:/shots/2017-07-30-in-the-sanctuary.png',
//     'store:/shots/2017-08-15-yagrum-bagarn-talks-to-uupse-fyr.png',
//     'store:/shots/2017-08-29-at-the-coast-of-hirstaang-forest.png',
//     'store:/shots/2017-09-08-sky-castle.png',
//   ],
// });

// await renderCalendarToFolder({
//   folder: '.temp/2029',
//   year: 2029,
//   ru: true,
//   images: [
//     'store:/shots/2017-09-10-mzahnch.png',
//     'store:/shots/2017-09-15-lava-swamps.png',
//     'store:/shots/2017-10-18-recollecting-the-first-steps.png',
//     'store:/shots/2017-10-29-wilted-littoral.png',
//     'store:/shots/2017-11-08-warehouse-shipping-log.png',
//     'store:/shots/2017-11-28-evening-mournhold.png',
//     'store:/shots/2017-12-31-night-rendezvous.png',
//     'store:/shots/2018-01-03-one-more-evening-in-balmora.png',
//     'store:/shots/2018-01-09-dead-trees-of-the-east-coast.png',
//     'store:/shots/2018-01-13-coming-to-balmora.png',
//     'store:/shots/2018-04-27-playing-tag.png',
//     'store:/shots/2018-05-01-view-of-bthanchend.png',
//   ],
// });

// await renderCalendarToFolder({
//   folder: '.temp/2030',
//   year: 2030,
//   ru: true,
//   images: [
//     'store:/shots/2018-05-09-dark-sanctuary-of-dark.png',
//     'store:/shots/2018-05-29-at-the-tops-of-fir-trees.png',
//     'store:/shots/2018-07-18-view-of-private-property.png',
//   ],
// });

// // Варианты

// await renderCalendarToFolder({
//   folder: '.temp/2031',
//   year: 2031,
//   ru: true,
//   images: [
//     'store:/shots/2016-11-25-rain-on-dren-plantation.png',
//     'store:/shots/2024-03-02-queue.png',
//     'store:/shots/2024-12-02-top-post.png',
//     'store:/shots/2017-03-22-betty-netch-and-far-caldera.png',
//     'store:/shots/2024-12-05-in-the-evening-at-census-and-excise-office.png',
//     'store:/shots/2018-11-28-landing.png',
//     'store:/shots/2025-03-21-coming-to-ald-sotha.png',
//     'store:/shots/2018-10-24-snowfall-over-the-ice-river.png',
//     'store:/shots/2025-03-13-cold-beach.png',
//     'store:/shots/2020-05-19-night-guard.png',
//     'store:/shots/2018-12-02-three-imperial-dragons.png',
//     'store:/shots/2024-12-05-in-the-evening-at-census-and-excise-office.png',
//   ],
// });

// await renderCalendarToFolder({
//   folder: '.temp/2032',
//   year: 2032,
//   ru: true,
//   images: [
//     'store:/shots/2017-10-04-in-the-evening-time.png',
//     'store:/shots/2024-04-15-night-at-red-mountain.png',
//     'store:/shots/2026-01-06-1-a-small-victory.png',
//     'store:/shots/2024-12-31-a-look-into-the-darkness.png',
//     'store:/shots/2024-12-30-cold-rain-of-bitter-coast.png',
//     'store:/shots/2024-12-26-two-houses-on-the-outskirts.png',
//     'store:/shots/2026-04-14-1-dragon-in-slings.png',
//     'store:/shots/2024-03-25-bridge-at-ghostfence.png',
//     'store:/shots/2025-12-30-1-before-the-storm.png',
//     'store:/shots/2022-07-19-stillness-of-vivec.png',
//     'store:/shots/2022-07-03-crossing-the-edge-of-bitter-coast.png',
//     'store:/shots/2018-11-18-horror-of-the-red-corridor.png',
//   ],
// });

// await renderCalendarToFolder({
//   folder: '.temp/2033',
//   year: 2033,
//   ru: true,
//   images: [
//     'store:/shots/2025-12-03-1-near-mababi.png',
//     'store:/shots/2025-06-06-1-lava-gorge.png',
//     'store:/shots/2024-04-08-lava-fork.png',
//     'store:/shots/2024-03-31-fire-river.png',
//     'store:/shots/2019-04-02-towers-of-mzanchend.png',
//     'store:/shots/2018-05-03-sunset-over-the-lava-river.png',
//     'store:/shots/2017-07-16-mzanchend-before-the-ash-storm.png',
//     'store:/shots/2017-05-02-paper-trail.png',
//     'store:/shots/2016-11-20-3-molag-amur.png',
//     'store:/shots/2018-11-18-horror-of-the-red-corridor.png',
//   ],
// });

// От подписчиков

// 'store:/shots/2016-11-21-sheogorad.png',
// 'store:/shots/2017-10-04-in-the-evening-time.png',
// 'store:/shots/2018-03-12-mushroom-arch.png',
// 'store:/shots/2018-09-07-red-light.png',
// 'store:/shots/2018-10-24-snowfall-over-the-ice-river.png',
// 'store:/shots/2019-03-04-evening-road.png',
