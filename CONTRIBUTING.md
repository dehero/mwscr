`EN` [`RU`](CONTRIBUTING.ru.md)

# Contributing Guidelines

Here is the most important information for contributing to the [Morrowind Screenshots](https://github.com/dehero/mwscr)
project. If you don't find the answer to your question, please let
[administrator](https://mwscr.dehero.site/users/dehero/) know in any convenient way.

## Ways to contribute

There are several ways to contribute to the project.

### Propose your work

Before you can propose your screenshots, videos or drawings, read the
[minimum requirements](#minimum-requirements-to-works) and [shooting tips](#shooting-tips). Then send your work in any
convenient way:

- [Send to bot](https://t.me/mwscrbot) on Telegram.
- [Send proposal](https://github.com/dehero/mwscr/issues/new?labels=post-proposal&template=post-proposal.yml) via GitHub
  Issues.
- [Send to administrator](mailto:me@dehero.site?subject=mwscr) via email.

Proposed works will be automatically checked and will go to [drafts](https://mwscr.dehero.site/drafts/). After
[editing](#editing), your works will be published or rejected.

> [!WARNING]  
> When uploading files via Issues,
> [GitHub file size restrictions](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/attaching-files)
> apply. If you need to get around this, please add a link to the file uploaded to other hosting in the Issue.

> [!IMPORTANT]  
> By submitting your work, you agree that it will be stored in the project archive and may be used in any sources
> related to the project, with attribution to you.

> [!TIP]  
> Provide your profile addresses if you want a link to you in the post when the work is published.

### Request a screenshot or video

To ask the authors of the project to make a certain screenshot or video, leave a free-form message in any convenient
way:

- [Send request](https://github.com/dehero/mwscr/issues/new?labels=post-request&template=post-request.yml&title=Cool+to+see%2C+how+cliffracer+dies%21)
  via GitHub Issues.
- Write a comment or private message to the administrator in any of the project accounts.
- [Send to administrator](mailto:me@dehero.site?subject=mwscr) via email.

Your request will be added to [drafts](https://mwscr.dehero.site/drafts/) and will remain there, waiting for the
appropriate material.

> [!WARNING]  
> The request may be rejected if it does not meet the [minimum requirements](#minimum-requirements-to-works).

### Find missing location

If the location of shooting the screenshot or video is not specified in the post, you can suggest one. Navigate to post
page or right click (long tap) on post to show the context menu. Click `Locate` button and choose location from the list
in the dialog. You can select multiple locations if needed.

Submit your suggestion using any of available submitting options in the dialog. Another option is to write a comment
with the suggested location under post in any of project's channels. The project administrator will check your
suggestion and accept it if it was confirmed.

### Improve the repository

Any suggestions for improving and fixing the repository are welcome:

- [Suggest changes](https://github.com/dehero/mwscr/pulls) via Pull Request.
- [Describe an idea or problem](https://github.com/dehero/mwscr/issues) in free form via Issues.
- [Write to administrator](mailto:me@dehero.site?subject=mwscr) via email.

## Minimum requirements for works

To expect your work to be accepted into the project, a few minimum requirements must be met.

### In a suitable format

Screenshots should be initially captured and drawings saved in `PNG` graphic format (uncompressed). For videos, `MP4` or
`AVI` format with a high bitrate is suitable. Files can be folded into a `ZIP` archive for easy transfer. File
requirements for automatic verification:

| Resource type | Format       |  Height | Width   |  Duration | Framerate |     Size |
| ------------- | :----------- | ------: | ------: | --------: | --------: | -------: |
| Image         | `PNG`        |   ≥ 800 |   ≥ 800 |           |           |  ≤ 10 MB |
| Video         | `MP4` `AVI`  |  ≥ 1080 |  ≥ 1080 |  ≥ 10 sec |  ≥ 30 fps | ≤ 200 MB |
| Archive       | `ZIP`        |         |         |           |           | ≤ 100 MB |

### No interface elements

All interface elements (crosshair, map, health bars, menu, console, etc.) should be hidden from the screen. You can
disable the interface with the console command `tm` or `ToggleMenus`. In the OpenMW engine, you can use the `F11` key
for the same purpose.

### No modifications

There should be no content or graphical modifications to the game, except for official modifications from Bethesda
Softworks and the white list of unofficial addons. Work will be rejected if there are textures, models, objects, or
situations that could not have been in the original game. Currently, the use of official addons Tribunal and Bloodmoon
and [auxiliary plugins](#auxiliary-plugins) is allowed. The white list of unofficial addons currently includes only
[Tamriel Rebuilt](https://www.tamriel-rebuilt.org/).

> [!IMPORTANT]  
> Remember that mysterious fog, an understated color scheme, and strange angular shapes are important parts of the
> atmosphere of our favorite game. Your goal is not to demonstrate the possibilities of mods but to show how beautiful
> the game can be without them.

### Unprocessed

Screenshots and videos that have been processed in a graphic editor beforehand will not be accepted. Minor processing is
allowed only during the editing process. If you still want to offer your own variant of processing, be sure to send the
original image as well.

## Shooting tips

To make it easier to take high-quality pictures, follow these tips.

### Game engine and utilities

Preferably use the latest version of the [OpenMW](https://openmw.org/) engine or the vanilla Morrowind engine with
[MGE](https://www.nexusmods.com/morrowind/mods/41102). You need to set high resolution and enable anti-aliasing. You can
enable slight graphical enhancements, such as water shaders. You can increase the number of loadable cells in exteriors,
but using distant land is not recommended.

To take screenshots in the vanilla engine, use the `PrtScn` key, and in the OpenMW engine, use the `F12` key. To capture
video, you can use screen capture programs such as [OBS Studio](https://obsproject.com/).

### Aspect ratio

Keep in mind that your screenshot may be cropped before publishing, so all the important objects should stay in the
final format and the composition should remain balanced. To simplify things, you can purposely launch the game in a
window with the desired aspect ratio. A common scenario is to run the game in a window with resolution 1080x1080.

### Field of view

You can change the field of view in the game settings on the fly, increasing it to get more objects in the frame or,
vice versa, decreasing it to get a close-up. Be sure to do so within reasonable limits and avoid distorting the
perspective too much.

### Drawing distance and fog

Control the viewing distance in the game settings, depending on your artistic intent. Sometimes it's better to cover the
distant background with haze to keep the viewer's attention on the main foreground objects. For shooting distant
backgrounds, you can slightly increase the drawing distance. Make sure that the look of the game remains close to
vanilla.

### Free camera

The console command `tcl` or `ToggleCollision` enables the free camera mode, in which you can levitate freely and walk
through walls. This helps you get interesting shots from hard-to-reach angles.

### God mode

The `tgm` or `ToggleGodMode` console command protects you from falling damage and character attacks, allowing you to
concentrate on shooting without worrying about the protagonist's health. The [NoFightNoHello](#nofightnohello) plugin
can also protect you from character attacks, but it will be harder to shoot battle scenes with it.

### Quick travel

To travel to an exterior without a name, type its coordinates in the console:

```txt
coe 10 -5
```

To travel to an exterior with a name or to an interior, type its name:

```txt
coc "Ald-ruhn, Manor District"
```

### Movement speed

To speed up your character a lot, type in the console:

```txt
player->setspeed 500
```

You can set higher values. This helps you move around the world faster while looking for shooting locations. Once you
find a shooting location, you'll want to get a more accurate angle by slowing down your movement. To make your character
as slow as possible, type:

```txt
player->setspeed 0
```

### Time of day

When shooting exteriors, it can be useful to adjust the lighting or moon position by changing the time of day. For
example, if you want to shoot during sunset at 7:00 PM, you need to type in the console:

```txt
set gamehour to 19
```

## Auxiliary plugins

The listed plugins give you additional options when shooting.

### NoFightNoHello

Turns off greeting phrases and removes aggression from all NPCs and creatures. Allows you to take screenshots without
distracting from gameplay.

[Download](assets/plugins/NoFightNoHello.esp)

### MannequinChallenge

Applies a permanent paralysis effect to an NPC or creature. Allows you to lock a character in one place to make shooting
easier.

[Download](assets/plugins/MannequinChallenge.esp)

To apply the effect, you need to open the console, select the character, and type:

```txt
addspell mannequinchallenge
```

To remove the effect:

```txt
removespell mannequinchallenge
```

### TrackPath

Allows you to record the player's movement along three coordinates and play it back smoothly later. Suitable for
preparing smooth movement through the game world when shooting video. Works well only on the OpenMW engine.

[Download](assets/plugins/TrackPath.esp)

To start recording the player's movement, open the console and type:

```txt
set trackPath to 1
```

A message will appear that the recording of path `PATH_NUMBER` has started. You need to memorize this number to be able
to play the recorded path later. Move your character around the game world. You can move between locations by activating
doors; the recording of movement will continue.

To stop the recording of the player's movement, you need to type in the console:

```txt
set trackPath to 0
```

Before playing the recorded path, you need to move the character to the original location, where the beginning of the
path is located. To play the recorded path `PATH_NUMBER`, type in the console:

```txt
set playPath to PATH_NUMBER
```

The path will start playing, smoothly moving your character through the world. The transition between locations is not
automatic. You need to manually activate the doors when you are close to them to continue playing the path. You can
interrupt playing the path with the command:

```txt
set playPath to 0
```

## Editing

Editing is performed by the project administrator. You can follow the process on the pages of the
[Drafts](https://mwscr.dehero.site/drafts/) section. If you have any questions, write to
[administrator](https://mwscr.dehero.site/users/dehero/) in any convenient way.

### Search for violations

The content of the post is manually checked, and if any violations are found, the post is moved to
[rejects](https://mwscr.dehero.site/rejects/). Possible violations:

- Inappropriate content
- Graphic issues
- Non-vanilla look
- Uses or requires mods
- UI is visible
- JPEG artifacts
- No anti-aliasing
- Unclear request

### Merging posts

Multiple variants of the same work are merged into a single post to make it easier to choose which variant to publish.
This is done using
[merging issue](https://github.com/dehero/mwscr/issues/new?labels=post-merging&template=post-merging.yml&title=POST_ID).

If the work is a response to one of the pending requests, it is merged with the original request into a single post.

### File processing

Files added to `store:/inbox` are processed with the graphics editor, which may include:

- cropping;
- brightness adjustment;
- correction of technical errors in shooting (in rare cases);
- duration trimming (for video).

Processing is intended to improve the perception of the original work while preserving the original content as much as
possible.

> [!CAUTION]  
> It is forbidden to change the color scheme, apply filters, add, change, or distort objects.

During processing, the original files remain intact, and each new variant is saved to a separate file with the variant
number appended to the file name. For example:

```txt
dehero.2024-02-17-10-53-36.png
dehero.2024-02-17-10-53-36.1.png
dehero.2024-02-17-10-53-36.2.png
```

Processed versions will be added to [drafts](https://mwscr.dehero.site/drafts/) the next time files are imported from
the storage.

### Preparing a post

Use
[editing issue](https://github.com/dehero/mwscr/issues/new?labels=post-editing&template=post-editing.yml&title=POST_ID)
to fill in the post fields.

#### Type and content

Depending on the content of the post and its characteristics, the appropriate post type is selected:

| Type          | Ratio  | Files  | Best size | Min. size  |  Duration | Additional requirements                                                    |
| ------------- | :----: | -----: | :-------: | :--------: | --------: | -------------------------------------------------------------------------- |
| `shot`        |   1:1  |      1 | 1080x1080 |  800x800   |           |                                                                            |
| `shot‑set`    |   1:1  |      4 | 1080x1080 |  800x800   |           | All images must have been previously published with the `shot` type.       |
| `redrawing`   |   1:1  |      2 | 1080x1080 |  800x800   |           | The second image must have been previously published with the `shot` type. |
| `wallpaper`   |  16:9  |      1 | 1920x1080 | 1920x1080  |           |                                                                            |
| `wallpaper-v` | 9:19.5 |      1 | 1080x2340 | 1080x2340  |           |                                                                            |
| `clip`        |   1:1  |      1 | 1080x1080 |  800x800   |   ≤ 1 min |                                                                            |
| `video`       |  16:9  |      1 | 1920x1080 | 1920x1080  |  ≤ 60 min |                                                                            |

The content is adjusted to the selected post type, and any rejected files go into the post's trash.

#### Title

The title of the post is chosen according to its content and can either simply describe what is shown or expand the
perception of the post by using analogies, references, and other techniques. The title suggested by the author of the
work is also taken into account.

The title should be filled in English and translated into Russian (for publication in VK).

#### Author

The project contributor who proposed the original work for publication. For
[Redrawing](https://mwscr.dehero.site/help/redrawing/) type posts, the first author is the author of the drawing, and
the second author is the author of the original post. For [Shot Compilation]((https://mwscr.dehero.site/help/shot-set/)
posts, the authors of all images in the set are listed.

Each of these authors must be added to the [project members list](data/users.yml) beforehand.

#### Tags

Tags are filled in based on the content of the post in Latin letters separated by a space. Posts with similar content
should receive similar tags to make it easier to find posts on the same subject. Information that is specified in other
fields of the post should be avoided in tags.

#### Game engine

Specifies the game engine used for the capture:

- OpenMW
- Vanilla

#### Addon

Specifies one of the allowed game addons explicitly involved in the post:

- Tribunal
- Bloodmoon

#### Location

Specifies the game location according to [location list](data/locations.yml). If the exact location cannot be
determined, the region of shooting is specified (for exterior shots).

### Selecting an editor's mark

The editor's mark helps to filter proposed works and monitor the overall quality of the project's post feed. The mark is
subjective, but the general guidelines for selecting it are described here:

| Indicator         | `A1`  | `A2`  | `B1`  | `B2`  | `C` | `D` | `E` | `F` | Evaluated                                             |
| ----------------- | :---: | :---: | :---: | :---: | :-: | :-: | :-: | :-: | ----------------------------------------------------- |
| Artistry          | +     | +     | ±     |       |     |     | ±   |     | Beauty, intent.                                       |
| Neatness          | +     | +     | ±     | +     |     |     |     |     | Graphics, framing.                                    |
| Composition       | +     | ±     | +     | ±     | ±   |     | ±   |     | Foreshortening, placement of objects.                 |
| Lighting          | +     | ±     | +     | ±     | ±   |     | ±   |     | Light and colors.                                     |
| Experiment        |       |       |       |       |     |     | +   |     | Unconventional view.                                  |
| Fail              |       |       |       |       |     |     |     | +   | Potential for reshooting or revisiting.               |
| **Publishable**   |  ✓    |  ✓    | ✓     | ✓     | ✓   |     | ✓   |     |                                                       |

A work will receive the mark given in the title of the column if:

1. All indicators marked `+` are completed;
2. At least one of the indicators marked `±` is filled in.

If the selected mark is not publishable, such work is moved to [rejects](https://mwscr.dehero.site/rejects/).
