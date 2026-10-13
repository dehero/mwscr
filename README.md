`EN` [`RU`](README.ru.md)

# Morrowind Screenshots

![Morrowind Screenshots](assets/icon.png)

Original screenshots and videos from The Elder Scrolls III: Morrowind. No graphic and unlore mods. No color filters. No
interface.

- [Site](https://mwscr.dehero.site)
- [Instagram](https://instagram.com/mwscr/)
- [VK](https://vk.com/mwscr)
- [Telegram](https://t.me/mwscr)
- [YouTube](https://www.youtube.com/@mwscr)
- [GitHub](https://github.com/dehero/mwscr)

## About the project

The goal of the project is to seek out the hidden beauty and celebrate the visual aesthetics of Morrowind, a computer
game from [Bethesda Softworks](https://elderscrolls.bethesda.net/en/morrowind). Most of the content is created using the
[OpenMW](https://openmw.org/) open source engine. Main materials:

- [Posts](https://mwscr.dehero.site/posts/)
- [Extras](https://mwscr.dehero.site/extras/)
- [Drafts](https://mwscr.dehero.site/drafts/)
- [Rejects](https://mwscr.dehero.site/rejects/)
- [Members](https://mwscr.dehero.site/users/)

If you want to participate in the project, please read the [guide](CONTRIBUTING.md).

## About the repository

### Data

Information about main [`data/posts`](data/posts), extra [`data/extras`](data/extras), proposed
[`data/drafts`](data/drafts) and rejected [`data/rejects`](data/rejects) posts is stored by year in `YAML` format. The
original works, due to their large size, are represented by links to the `store:` external storage, which only the
project administrator has access to. Other files:

- [`data/users.yml`](data/users.yml) - information about project members in `YAML` format;
- [`data/locations.yml`](data/locations.yml) - list of game locations in `YAML` format.

### Additional files

The [`assets`](assets) folder contains:

- [`assets/previews`](assets/previews) - previews of all images and videos that have ever hit the storage in `AVIF`
  format;
- [`assets/plugins`](assets/plugins) - set of [auxiliary plugins](CONTRIBUTING.md#allowed-mods) for shooting;
- additional images.

### Scripts

The [`src`](src) folder contains scripts responsible for working with the repository, storage, and project accounts. You
need to install dependencies before running scripts locally:

```bash
npm ci
```

To work with external services and storage when running locally, create an `.env` file in the root of the repository
containing credentials:

```env
INSTAGRAM_ACCESS_TOKEN=
IMAGEKIT_PRIVATE_KEY=

VK_ACCESS_TOKEN=

TELEGRAM_PHONE_NUMBER=
TELEGRAM_SESSION=
TELEGRAM_API_APP_ID=
TELEGRAM_API_APP_HASH=

YOUTUBE_API_KEY=

YANDEX_DISK_STORE_PATH=
YANDEX_DISK_ACCESS_TOKEN=

LOCAL_STORE_PATH=
```

There is a [receiving credentials](CREDENTIALS.md) help document for the project administrator to fill in these
variables. Other contributors are limited in their possibilities when running the project locally.

#### Maintenance

The [`src/scripts/maintain.ts`](src/scripts/maintain.ts) script runs every hour on a schedule, or on any change to the
repository in the `main` branch. Manual launch is also possible:

```bash
npm run maintain
```

The sequence of steps is:

1. Create issue templates in [`.github/ISSUE_TEMPLATE`](.github/ISSUE_TEMPLATE) according to the descriptions in
   [`src/scripts/github-issue-resolvers`](src/scripts/github-issue-resolvers).
2. Add to [`data/posts`](data/posts) posts manually created in project accounts by the administrator.
3. Import to [`data/drafts`](data/drafts) new files from the `store:/inbox` added manually by the administrator.
4. Delete rejected posts to [`data/rejects`](data/rejects`), restore posts from the rejects to
   [`data/drafts`](data/drafts`).
5. Get reactions to posts in [`data/posts`](data/posts`) and [`data/extras`](data/extras`) from project accounts.
6. Create a new post in [`data/posts`](data/posts) or [`data/extras`](data/extras) according to the scenarios described
   in [`src/core/scenarios/posting.ts`](src/core/scenarios/posting.ts).
7. Publish unpublished posts from [`data/posts`](data/posts) and [`data/extras`](data/extras) to project accounts.
8. Create missing and delete unnecessary previews in [`assets/previews`](assets/previews).

#### Issue processing

The script [`src/scripts/resolve-github-issue.ts`](src/scripts/resolve-github-issue.ts) runs on creating or modifying an
Issue in the [Issues](https://github.com/dehero/mwscr/issues) section. Issues are the main tool for the administrator
and other contributors to interact with the project. The use of issues is described in the
[contributing guidelines](CONTRIBUTING.md).

#### Data validation

The [`src/scripts/validate.ts`](src/scripts/validate.ts) script checks the integrity of data in the [`data`](data)
folder and `store:` storage. Runs manually:

```bash
npm run validate
```

#### Code validation

```bash
npm run test
```

Runs all tests:

- `npm run test-unit` runs unit tests — files ending with `.unit.test.ts`;
- `npm run test-integration` runs integration tests that use real storage and network — files ending with
  `.integration.test.ts`.

#### Creating a release

```bash
npm run release
```

Checks if there are any changes in the project from the previous release. If there are, it creates a commit with new
release, incrementing the version in [package.json](package.json) and updating [CHANGELOG](CHANGELOG.md).

## Roadmap

As the project develops, it is planned to implement:

- [ ] support for publishing post types ~~`shot-set`~~, ~~`redrawing`~~, `clip` and `video` to project accounts;
- [x] lists of tags and locations with the number of posts in them;
- [x] adding multiple locations to a single post;
- [ ] ~~`wallpaper`~~, ~~`wallpaper-v`~~ and `video-v` post types;
- [x] support for accessing storage via a local file system;
- [ ] Telegram bot for accepting requests ~~and works~~;
- [ ] monthly releases of the archive with works for the previous month;
- [x] project site for quick search of works by author, location, tags, etc.

## License

- The code is licensed under [MIT](LICENSE-CODE)
- The content is licensed under [CC BY 4.0](LICENSE)

You can use the parts of the project code for any purpose, but you may not copy the project as a whole. Feel free to use
the content of the project for any purpose with the link to the original source and author.

All rights to The Elder Scrolls III: Morrowind, characters, textures, and assets belong to Bethesda Softworks and
ZeniMax Media. The rights to the Russian localization, used in this project, including text and voice acting, belong to
Akella and 1C-SoftClub.
