# TrackPath

[A plugin](./allowed-mods.md) that allows you to record the player's movement along three coordinates and play it back
smoothly later. Suitable for preparing smooth movement through the game world when shooting video. Works well only on
the [OpenMW](./openmw.md) engine.

To start recording the player's movement, open the console and type "set trackPath to 1". A message will appear that the
recording of path "PATH_NUMBER" has started. You need to memorize this number to be able to play the recorded path
later. Move your character around the game world. You can move between locations by activating doors; the recording of
movement will continue. To stop the recording of the player's movement, you need to type in the console "set trackPath
to 0".

Before playing the recorded path, you need to move the character to the original location, where the beginning of the
path is located. To play the recorded path "PATH_NUMBER", type in the console "set playPath to PATH_NUMBER". The path
will start playing, smoothly moving your character through the world. The transition between locations is not automatic.
You need to manually activate the doors when you are close to them to continue playing the path. You can interrupt
playing the path with the command "set playPath to 0".

[Download](/plugins/TrackPath.esp)

---

# TrackPath

[Плагин](./allowed-mods.md), позволяющий записывать движение игрока по трём координатам и затем плавно воспроизводить
его. Подходит для подготовки плавного перемещения по игровому миру при съёмке видео. Хорошо работает только на движке
[OpenMW](./openmw.md).

Чтобы начать запись движения игрока, откройте консоль и введите "set trackPath to 1". Появится сообщение о том, что
началась запись пути "PATH_NUMBER". Этот номер нужно запомнить, чтобы позже воспроизвести записанный путь. Перемещайте
персонажа по игровому миру. Можно переходить между локациями, активируя двери; запись движения продолжится. Чтобы
остановить запись движения игрока, нужно ввести в консоли "set trackPath to 0".

Перед воспроизведением записанного пути нужно переместить персонажа в исходную локацию, где находится начало пути.
Чтобы воспроизвести записанный путь "PATH_NUMBER", введите в консоли "set playPath to PATH_NUMBER". Путь начнёт
воспроизводиться, плавно перемещая персонажа по миру. Переход между локациями не происходит автоматически. Чтобы
продолжить воспроизведение пути, нужно вручную активировать двери, когда вы окажетесь рядом с ними. Воспроизведение
пути можно прервать командой "set playPath to 0".

[Скачать](/plugins/TrackPath.esp)
