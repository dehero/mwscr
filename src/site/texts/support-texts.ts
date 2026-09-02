import type { IntlText } from '../../core/entities/intl.js';

export const supportTexts = {
  order: ['Order', 'Заказать'],
  merchOrdering: ['Merch Ordering', 'Заказ мерча'],
  country: ['Country', 'Страна'],
  checkCountry: ['Check Country', 'Проверить страну'],
  checkMyCountry: ['CHECK MY COUNTRY', 'ПРОВЕРИТЬ МОЮ СТРАНУ'],
  noShippingOptions: [
    'Sorry, there are no shipping options to selected country for now.',
    'К сожалению, сейчас нет вариантов доставки в выбранную страну.',
  ],
  countryRequestHint: [
    'Please submit a request to let the administrator contact you later to clarify the possibility of making an order to your country.',
    'Отправьте запрос, чтобы администратор позднее связался с вами и уточнил возможность заказа в вашу страну.',
  ],
  sendEmail: ['Send Email', 'Отправить письмо'],
  subscribe: ['Subscribe', 'Подписаться'],
  subscription: ['Subscription', 'Подписка'],
  subscriptionDescription: [
    "Follow the project's channels in social media to stay in tune with community and receive notifications of new posts:",
    'Подпишитесь на каналы проекта в социальных сетях, чтобы оставаться в курсе жизни сообщества и получать уведомления о новых постах:',
  ],
  subscriptionMerchDescription: [
    'Follow <merch>merch</merch> updates on these profiles:',
    'Следите за обновлениями <merch>мерча</merch> в этих профилях:',
  ],
  sponsor: ['Support', 'Поддержать'],
  sponsorship: ['Support', 'Поддержка'],
  sponsorshipDescription: [
    'Order <merch>merch</merch> or reward separate posts if you like using the following instruments in social media:',
    'Закажите <merch>мерч</merch> или вознаградите отдельные посты через следующие инструменты в социальных сетях:',
  ],
} satisfies Record<string, IntlText>;
