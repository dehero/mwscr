export interface CalendarWeekdayDescriptor {
  title: string;
  titleRu: string;
  shortTitle: string;
  shortTitleRu: string;
  gregorianTitle: string;
  gregorianTitleRu: string;
  weekend?: boolean;
}

export interface CalendarMonthDescriptor {
  title: string;
  titleRu: string;
  sign: string;
  signRu: string;
  gregorianTitle: string;
  gregorianTitleRu: string;
}

export const calendarWeekdayDescriptors: CalendarWeekdayDescriptor[] = [
  {
    title: 'Sundas',
    titleRu: 'Сандас',
    shortTitle: 'Sun',
    shortTitleRu: 'Сан',
    gregorianTitle: 'Sunday',
    gregorianTitleRu: 'Воскресенье',
    weekend: true,
  },
  {
    title: 'Morndas',
    titleRu: 'Морндас',
    shortTitle: 'Morn',
    shortTitleRu: 'Морн',
    gregorianTitle: 'Monday',
    gregorianTitleRu: 'Понедельник',
  },
  {
    title: 'Tirdas',
    titleRu: 'Тирдас',
    shortTitle: 'Tir',
    shortTitleRu: 'Тир',
    gregorianTitle: 'Tuesday',
    gregorianTitleRu: 'Вторник',
  },
  {
    title: 'Middas',
    titleRu: 'Миддас',
    shortTitle: 'Mid',
    shortTitleRu: 'Мид',
    gregorianTitle: 'Wednesday',
    gregorianTitleRu: 'Среда',
  },
  {
    title: 'Turdas',
    titleRu: 'Турдас',
    shortTitle: 'Tur',
    shortTitleRu: 'Тур',
    gregorianTitle: 'Thursday',
    gregorianTitleRu: 'Четверг',
  },
  {
    title: 'Fredas',
    titleRu: 'Фредас',
    shortTitle: 'Fre',
    shortTitleRu: 'Фре',
    gregorianTitle: 'Friday',
    gregorianTitleRu: 'Пятница',
  },
  {
    title: 'Loredas',
    titleRu: 'Лордас',
    shortTitle: 'Lor',
    shortTitleRu: 'Лор',
    gregorianTitle: 'Saturday',
    gregorianTitleRu: 'Суббота',
    weekend: true,
  },
];

export const calendarMonthDescriptors: CalendarMonthDescriptor[] = [
  {
    title: 'Morning Star',
    titleRu: 'Месяц Утренней Звезды',
    sign: 'Ritual',
    signRu: 'Ритуал',
    gregorianTitle: 'January',
    gregorianTitleRu: 'Январь',
  },
  {
    title: "Sun's Dawn",
    titleRu: 'Месяц Восхода',
    sign: 'Lover',
    signRu: 'Любовник',
    gregorianTitle: 'February',
    gregorianTitleRu: 'Февраль',
  },
  {
    title: 'First Seed',
    titleRu: 'Месяц Первоцвета',
    sign: 'Lord',
    signRu: 'Лорд',
    gregorianTitle: 'March',
    gregorianTitleRu: 'Март',
  },
  {
    title: "Rain's Hand",
    titleRu: 'Месяц Дождя',
    sign: 'Mage',
    signRu: 'Маг',
    gregorianTitle: 'April',
    gregorianTitleRu: 'Апрель',
  },
  {
    title: 'Second Seed',
    titleRu: 'Месяц Сева',
    sign: 'Shadow',
    signRu: 'Тень',
    gregorianTitle: 'May',
    gregorianTitleRu: 'Май',
  },
  {
    title: 'Mid Year',
    titleRu: 'Месяц Середины Года',
    sign: 'Steed',
    signRu: 'Конь',
    gregorianTitle: 'June',
    gregorianTitleRu: 'Июнь',
  },
  {
    title: "Sun's Height",
    titleRu: 'Месяц Солнцеворота',
    sign: 'Apprentice',
    signRu: 'Ученик',
    gregorianTitle: 'July',
    gregorianTitleRu: 'Июль',
  },
  {
    title: 'Last Seed',
    titleRu: 'Месяц Урожая',
    sign: 'Warrior',
    signRu: 'Воин',
    gregorianTitle: 'August',
    gregorianTitleRu: 'Август',
  },
  {
    title: 'Hearthfire',
    titleRu: 'Месяц Огня',
    sign: 'Lady',
    signRu: 'Леди',
    gregorianTitle: 'September',
    gregorianTitleRu: 'Сентябрь',
  },
  {
    title: 'Frostfall',
    titleRu: 'Месяц Мороза',
    sign: 'Tower',
    signRu: 'Башня',
    gregorianTitle: 'October',
    gregorianTitleRu: 'Октябрь',
  },
  {
    title: "Sun's Dusk",
    titleRu: 'Месяц Заката',
    sign: 'Atronach',
    signRu: 'Атронах',
    gregorianTitle: 'November',
    gregorianTitleRu: 'Ноябрь',
  },
  {
    title: 'Evening Star',
    titleRu: 'Месяц Вечерней Звезды',
    sign: 'Thief',
    signRu: 'Вор',
    gregorianTitle: 'December',
    gregorianTitleRu: 'Декабрь',
  },
];

interface CalendarHoliday {
  title: string;
  titleRu: string;
  monthIndex: number;
  day: number;
  description: string;
  descriptionRu: string;
}

// https://tes3.ucoz.ru/index/kalendar/0-13
// https://en.uesp.net/wiki/Lore:Holidays
export const calendarHolidays: CalendarHoliday[] = [
  {
    title: 'New Life Festival',
    titleRu: 'Фестиваль Новой Жизни',
    monthIndex: 0,
    day: 1,
    description:
      'A Tamriel-wide event that celebrates the birth of a new year and the death of the old year. Celebrations include races, feasts, games, and dancing.',
    descriptionRu:
      'В этот день жители Империи празднуют начало нового года. Традиционно в этот день бесплатно раздают эль во всех тавернах Тамриэля.',
  },
  {
    title: "South Wind's Prayer",
    titleRu: 'Молитва Южного Ветра',
    monthIndex: 0,
    day: 15,
    description:
      "A plea by all the religions of Tamriel for a good planting season. Citizens flock to services in the cities' temples in the hopes of receiving free healing.",
    descriptionRu:
      'Мольба всех религий Тамриэля о сезоне хорошего урожая. Граждане со всеми известными в Тамриэле недугами толпами стекаются ко всем храмам, так как духовенство в этот день осуществляет бесплатное исцеление.',
  },
  {
    title: "Heart's Day",
    titleRu: 'День Сердца',
    monthIndex: 1,
    day: 16,
    description:
      'A holiday celebrated all over Tamriel. In honor of lovers Polydor and Eloisa, the inns of various cities offer a free room for visitors.',
    descriptionRu:
      'Праздник, отмечаемый во всем Тамриэле. В честь Влюбленных Полидора и Элоизы все гостиницы Тамриэля предлагают посетителям комнаты бесплатно.',
  },
  {
    title: 'First Planting',
    titleRu: 'Первый Посев',
    monthIndex: 2,
    day: 7,
    description:
      'The people of Tamriel celebrate First Planting, symbolically sowing the seeds for the autumn harvest. The clerics at the temples run free clinic all day to cure people of various ailments.',
    descriptionRu:
      'Люди Тамриэля празднуют Первый Посев, символически сея зерна для осеннего урожая. Соседи улаживают свои споры, проблемы разрешаются, вредные привычки оставляются. Священники в храмах весь день бесплатно работают в больницах.',
  },
  {
    title: 'Hogithum',
    titleRu: 'Хогитум',
    monthIndex: 2,
    day: 21,
    description: 'In Daggerfall, this is the Summoning Day for Azura.',
    descriptionRu:
      'День, когда все жрецы Темных эльфов призывают Принцессу Даэдр Азуру для поддержки и покровительства.',
  },
  {
    title: "Jester's Festival",
    titleRu: 'День Шутника',
    monthIndex: 3,
    day: 28,
    description:
      'An annual holiday where troupes of jesters and fools encourage the people of Tamriel to celebrate the foolish and absurd. The Thieves Guild takes advantage of the insanity.',
    descriptionRu:
      'День Шутника во всех городах Тамриэля. Волна шалостей прокатывается из одного конца города в другой. Гильдии Воров уделяется особое внимание.',
  },
  {
    title: 'Second Planting',
    titleRu: 'Второй Посев',
    monthIndex: 4,
    day: 7,
    description:
      'A holiday with traditions similar to First Planting. The free clinics of the temples are open for the second and last time this year, offering cures for those suffering from any kind of disease.',
    descriptionRu:
      'Праздник с традициями, сходными с Первой Посадкой. Бесплатные лечебницы открыты во второй и последный раз в этом году, предлагая излечение всем страдающим от любой болезни или недуга.',
  },
  {
    title: 'Mid Year Celebration',
    titleRu: 'Праздник Середины Года',
    monthIndex: 5,
    day: 16,
    description:
      "The traditional day for the Mid Year Celebration. The cities' temples offer blessings for only half the donation they usually suggest.",
    descriptionRu:
      'Традиционный день для Празднества Середины Года. Храмы предлагают благословения только за половину денежного подношения, которое они обычно запрашивают.',
  },
  {
    title: 'Tibedetha',
    titleRu: 'Тибедета',
    monthIndex: 5,
    day: 24,
    description:
      "Middle Tamrielic for 'Tibers Day.' The lorddom of Alcaire celebrates its most famous native Tiber Septim with a great party.",
    descriptionRu:
      'День Тайбера - жители Алькаири отмечают день рождения своего самого знаменитого земляка Тайбера Септима.',
  },
  {
    title: "Merchants' Festival",
    titleRu: 'Фестиваль Купцов',
    monthIndex: 6,
    day: 10,
    description:
      'Every marketplace and equipment store has dropped their prices to at least half. The only shop not being patronized today is the Mages Guild.',
    descriptionRu:
      'Каждый рынок и магазин снаряжения снизил свои цены по крайней мере вдвое. Единственное исключение - магазин Гильдии Магов.',
  },
  {
    title: "Sun's Rest",
    titleRu: 'Отдых Солнца',
    monthIndex: 6,
    day: 20,
    description:
      "All stores are closed in observance of Sun's Rest. Most citizens choose to devote this day to relaxation, not commerce or prayer.",
    descriptionRu:
      'Все лавки закрыты. Большинство граждан предпочитает посвятить этот день отдыху. Гильдия Купцов налагает большие штрафы на любой магазин, который продолжает работать.',
  },
  {
    title: "Harvest's End",
    titleRu: 'Конец Страды',
    monthIndex: 7,
    day: 27,
    description:
      'The time when all the seeding, sowing, and reaping of the year is over. The taverns offer free drinks all day long. Visitors are invited to join the farmers.',
    descriptionRu:
      'Годовой труд завершен: засев, посев и жатва. Таверны весь день ставят бесплатную выпивку. Фермеры приглашают приезжих присоединиться к празднованию.',
  },
  {
    title: 'Tales and Tallows',
    titleRu: 'Россказни и Страшилки',
    monthIndex: 8,
    day: 3,
    description:
      'A day associated with the dead and spirits. While most people celebrate it, they still hold superstitious fears of the walking dead. Values necromancy as the oldest magical science.',
    descriptionRu:
      'Некоторые безмолвствуют из-за боязни злых духов, большинство наслаждаются праздником. В честь некромантии, магические предметы сегодня продаются за полцены.',
  },
  {
    title: "Nerevarine's Arrival to Vvardenfell",
    titleRu: 'Прибытие Нереварина на Вварденфелл',
    monthIndex: 8,
    day: 16,
    description: 'The day the future Nerevarine set foot on Vvardenfell at the village of Seyda Neen.',
    descriptionRu: 'День, когда будущий Нереварин сошёл на берег Вварденфелла в деревушке Сейда Нин.',
  },

  {
    title: 'Witches Festival',
    titleRu: 'Фестиваль Ведьм',
    monthIndex: 9,
    day: 13,
    description:
      "Ghosts, demons, and evil spirits are mocked and celebrated by both occult occurrences and outrageous costumes. Coincides with Mephala's summoning day.",
    descriptionRu:
      'День, когда противоборствуют магические и религиозные силы. Оружие и предметы полностью обесцениваются из-за их мистического потенциала, а магические заклинания идут за половину их обычной цены.',
  },
  {
    title: 'Warriors Festival',
    titleRu: 'Фестиваль Воинов',
    monthIndex: 10,
    day: 20,
    description:
      'Most of the local warriors, spellswords, and rogues flock to equipment stores and blacksmiths, where all weapons are half price.',
    descriptionRu:
      'Почти все местные бойцы, меченосцы и разбойники отправляются в оружейные лавки и кузницы, так как все вооружение идет за полцены.',
  },
  {
    title: "North Wind's Prayer",
    titleRu: 'Молитва Северного Ветра',
    monthIndex: 11,
    day: 15,
    description:
      'A thanksgiving to the Gods for a good harvest and a mild winter. The temples offer all their services for half the donation usually requested.',
    descriptionRu:
      'Благодарение Богам за щедрый урожай и умеренную погоду. Храмы предлагают свои услуги: благословение, излечение, исцеление за половину обычно запрашиваемой суммы.',
  },
  {
    title: 'Old Life Festival',
    titleRu: 'Старая Жизнь',
    monthIndex: 11,
    day: 30,
    description:
      'A time people write messages of remembrance for their dead loved ones, and may occasionally receive an answer from Aetherius. People reflect on their past.',
    descriptionRu:
      'В последний день года Империя отмечает праздник. Многие идут в храмы, чтобы поразмышлять над своим прошлым. По слухам, священники будут воскрешать возлюбленных друзей и членов семей бесплатно.',
  },
];

export function isCalendarDateWeekend(date: Date): boolean {
  const dayOfWeek = date.getDay();
  return calendarWeekdayDescriptors[dayOfWeek]?.weekend ?? false;
}

export function getCalendarDateHoliday(date: Date): CalendarHoliday | undefined {
  const day = date.getDate();
  const monthIndex = date.getMonth();

  return calendarHolidays.find((holiday) => holiday.monthIndex === monthIndex && holiday.day === day);
}
