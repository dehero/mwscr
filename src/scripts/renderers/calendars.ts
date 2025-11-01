import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import {
  calendarMonthDescriptors,
  calendarWeekdayDescriptors,
  getCalendarDateHoliday,
  isCalendarDateWeekend,
} from '../../core/entities/calendar.js';
import type { ImageResourceUrl } from '../../core/entities/resource.js';
import { site } from '../../core/services/site.js';
import { htmlToImage } from '../utils/image-utils.js';
import { getResourceForHtml } from './utils/resource-utils.js';

let calendarStyle: string | undefined;
let fontDataUrl: string | undefined;

export interface CalendarCell {
  text: string;
  highlighted?: boolean;
}

export interface RenderCalendarToFolderArgs {
  folder: string;
  year: number;
  ru?: boolean;
  images: Array<ImageResourceUrl | undefined>;
}

export async function renderCalendarToFolder({ folder, year, ru, images }: RenderCalendarToFolderArgs) {
  try {
    await mkdir(folder, { recursive: true });
  } catch {
    // Ignore
  }

  const { image, html } = await renderCalendarCover({ year, ru });
  // @ts-expect-error TODO: resolve typing issues
  await writeFile(path.join(folder, `00.png`), image);
  await writeFile(path.join(folder, `00.html`), html, 'utf-8');

  for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
    const basename = (monthIndex + 1).toString().padStart(2, '0');

    const { image, html } = await renderCalendarMonth({ year, monthIndex, ru, imageUrl: images[monthIndex] });
    // @ts-expect-error TODO: resolve typing issues
    await writeFile(path.join(folder, `${basename}.png`), image);
    await writeFile(path.join(folder, `${basename}.html`), html, 'utf-8');
  }
}

export interface RenderCalendarCoverArgs {
  year: number;
  ru?: boolean;
}

export async function renderCalendarCover({ year, ru }: RenderCalendarCoverArgs) {
  const html = await createCalendarCoverHtml({
    year,
    ru,
  });
  const image = await htmlToImage(html);

  return { html, image };
}

export interface RenderCalendarMonthArgs {
  year: number;
  monthIndex: number;
  imageUrl?: ImageResourceUrl;
  ru?: boolean;
}

export async function renderCalendarMonth({ year, monthIndex, ru, imageUrl }: RenderCalendarMonthArgs) {
  const descriptor = calendarMonthDescriptors[monthIndex];
  if (!descriptor) {
    throw new Error(`No descriptor found for month index ${monthIndex}`);
  }

  const firstDay = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0);
  const totalDays = lastDay.getDate();
  const holidays: string[] = [];

  const firstDayOfWeek = firstDay.getDay();
  const weekStart = ru ? 1 : 0;

  const days: CalendarCell[] = [];

  let daysBeforeMonth = firstDayOfWeek - weekStart;
  if (daysBeforeMonth < 0) {
    daysBeforeMonth += 7;
  }

  for (let i = 0; i < daysBeforeMonth; i++) {
    days.push({ text: '' });
  }

  for (let day = 1; day <= totalDays; day++) {
    const date = new Date(year, monthIndex, day);
    const holiday = getCalendarDateHoliday(date);

    if (holiday) {
      holidays.push(`${day} — ${ru ? holiday.titleRu : holiday.title}`);
    }

    days.push({
      text: day.toString(),
      highlighted: isCalendarDateWeekend(date) || Boolean(holiday),
    });
  }

  const totalCells = Math.ceil(days.length / 7) * 7;
  while (days.length < totalCells) {
    days.push({ text: '' });
  }

  const title = ru ? descriptor.titleRu : descriptor.title;
  const sign = ru ? descriptor.signRu : descriptor.sign;
  const weekdays = [
    ...calendarWeekdayDescriptors.slice(weekStart),
    ...calendarWeekdayDescriptors.slice(0, weekStart),
  ].map((weekday) => ({ text: ru ? weekday.shortTitleRu : weekday.shortTitle, highlighted: weekday.weekend }));

  const html = await createCalendarMonthHtml({ title, imageUrl, days, weekdays, holidays, sign });
  const image = await htmlToImage(html);

  return { html, image };
}

export async function createCalendarMonthHtml({
  title,
  imageUrl = 'file://./assets/avatar.png',
  weekdays,
  days,
  holidays,
}: CreateCalendarMonthHtmlArgs): Promise<string> {
  if (!calendarStyle) {
    const data = await readFile('./assets/calendar.css', 'utf-8');
    if (!calendarStyle) {
      calendarStyle = data;
    }
  }

  if (!fontDataUrl) {
    const data = `data:application/font-woff2;charset=utf-8;base64,${await readFile(
      './src/site/fonts/MysticCards.woff2',
      'base64',
    )}`;
    if (!fontDataUrl) {
      fontDataUrl = data;
    }
  }

  const image = await getResourceForHtml(imageUrl);

  return `
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @font-face { font-family: 'MysticCards'; src: url("${fontDataUrl}") format('woff2'); }
  </style>
  <style type='text/css'>${calendarStyle}</style>
</head>
<body>
  <div class="month-page">
    <div class="image">
      <img class="screenshot" src="${image.dataUrl}" />
      <div class="title">${title}</div>
    </div>
    <div class="calendar">
      <div class="weekdays">
        ${weekdays
          .map((weekday) => `<div class="weekday ${weekday.highlighted ? 'highlighted' : ''}">${weekday.text}</div>`)
          .join('')}
      </div>
      <div class="days">
        ${days.map((day) => `<div class="day ${day.highlighted ? 'highlighted' : ''}">${day.text}</div>`).join('')}
      </div>
      <div class="footer">
        ${holidays.join(', ')}
      </div>
    </div>
  </div>
</body>
</html>
`;
}

interface CreateCalendarMonthHtmlArgs {
  title: string;
  imageUrl?: ImageResourceUrl;
  weekdays: CalendarCell[];
  days: CalendarCell[];
  holidays: string[];
  sign: string;
}

interface CreateCalendarCoverHtmlArgs {
  year: number;
  ru?: boolean;
}

export async function createCalendarCoverHtml({ year, ru }: CreateCalendarCoverHtmlArgs): Promise<string> {
  if (!calendarStyle) {
    const data = await readFile('./assets/calendar.css', 'utf-8');
    if (!calendarStyle) {
      calendarStyle = data;
    }
  }

  if (!fontDataUrl) {
    const data = `data:application/font-woff2;charset=utf-8;base64,${await readFile(
      './src/site/fonts/MysticCards.woff2',
      'base64',
    )}`;
    if (!fontDataUrl) {
      fontDataUrl = data;
    }
  }

  const logo = await getResourceForHtml('file://./assets/avatar.png');

  return `
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @font-face { font-family: 'MysticCards'; src: url("${fontDataUrl}") format('woff2'); }
  </style>
  <style type='text/css'>${calendarStyle}</style>
</head>
<body>
  <div class="cover-page">
    <img class="logo" src="${logo.dataUrl}" />
    <p class="name">${site.name}</p>
    <p class="info"><span class="prefix">${ru ? 'НЭ' : 'AD'}</span><span class="year">${year}</span></p>
    <div class="footer">
      ${site.origin.replace(/^https?:\/\//, '')}
    </div>
  </div>
</body>
</html>
`;
}
