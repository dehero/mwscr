import { renderCalendarToFolder } from './renderers/calendars.js';

await renderCalendarToFolder({
  folder: '.temp/2026',
  year: 2026,
  ru: true,
  images: [
    'store:/shots/2018-02-21-view-from-the-coastal-rocks.png', // Месяц Утренней Звезды
    'store:/shots/2016-12-28-close-to-caldera-clothier.png', // Месяц Восхода
    'store:/shots/2017-03-16-in-the-chambers-of-nchurdamz.png', // Месяц Первоцвета
    'store:/shots/2017-01-06-daedroth-in-grazelands.png', // Месяц Дождя
    'store:/shots/2016-12-20-a-boxy-nightstand.png', // Месяц Сева
    'store:/shots/2018-09-22-two-ways.png', // Месяц Середины Года
    'store:/shots/2018-08-20-mushroom-glade.png', // Месяц Солнцеворота
    'store:/shots/2018-08-27-coming-to-gnaar-mok.png', // Месяц Урожая
    'store:/shots/2017-04-26-divine-pentagon.png', // Месяц Огня
    'store:/shots/2018-06-29-road-to-a-dwemer-tower.png', // Месяц Мороза
    'store:/shots/2017-02-03-hlaalu-council-manor.png', // Месяц Заката
    'store:/shots/2018-11-09-dusk-in-the-skaal-village.png', // Месяц Вечерней Звезды
  ],
});
