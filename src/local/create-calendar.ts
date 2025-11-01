import { renderCalendarToFolder } from './renderers/calendars.js';

await renderCalendarToFolder({
  folder: '.temp/2026',
  year: 2026,
  ru: true,
  images: [
    'store:/shots/2018-11-09-dusk-in-the-skaal-village.png',
    'store:/shots/2018-11-11-through-the-snowy-forest.png',
    'store:/shots/2016-12-28-close-to-caldera-clothier.png',
    'store:/shots/2024-12-30-cold-rain-of-bitter-coast.png',
    'store:/shots/2017-03-16-in-the-chambers-of-nchurdamz.png',
    'store:/shots/2017-04-26-divine-pentagon.png',
    'store:/shots/2025-04-25-st-delyn-and-masser.png',
    'store:/shots/2018-08-20-mushroom-glade.png',
    'store:/shots/2018-01-09-dead-trees-of-the-east-coast.png',
    'store:/shots/2018-09-22-two-ways.png',
    'store:/shots/2017-01-06-daedroth-in-grazelands.png',
    'store:/shots/2018-02-21-view-from-the-coastal-rocks.png',
  ],
});
