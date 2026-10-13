# post rating

Post rating is calculated for published posts as the average engagement across all [Morrowind Screenshots](./mwscr.md)
accounts where the post was ever published.

```txt
reactions  = likes + reposts
engagement = reactions / followers x 100   (followers >= 50)
engagement = reactions                     (followers < 50)
rating     = average(engagement)           (2 or more accounts)
```

Accounts with fewer than 50 followers are counted in absolute reactions instead of a percentage. The rating is shown
only when there are engagement values from at least two accounts.

---

# рейтинг поста

Рейтинг поста рассчитывается для опубликованных постов как средняя вовлечённость по всем аккаунтам
[Morrowind Screenshots](./mwscr.md), где пост когда-либо был опубликован.

```txt
реакции       = лайки + репосты
вовлечённость = реакции / подписчики x 100   (подписчиков >= 50)
вовлечённость = реакции                      (подписчиков < 50)
рейтинг       = среднее(вовлечённость)       (2 и более аккаунтов)
```

Аккаунты с числом подписчиков меньше 50 учитываются в абсолютных реакциях, а не в процентах. Рейтинг показывается,
только когда есть значения вовлечённости минимум по двум аккаунтам.
