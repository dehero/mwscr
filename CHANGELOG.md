# Changelog

All notable changes to this project will be documented in this file.

## [1.5.0](https://github.com/dehero/mwscr/compare/v1.4.0...v1.5.0) (2024-07-10)

### Features

- **site:** add build time to home page
  ([24a7bdd](https://github.com/dehero/mwscr/commit/24a7bdd52cb5a2819f56294918c14e610486e1ef))

### Bug Fixes

- **site:** add correct link to user's pending posts
  ([dfa4f5e](https://github.com/dehero/mwscr/commit/dfa4f5eff3a6017f7444358a1b8d01ad16c0f0ac))
- **site:** don't show first user's post as primary
  ([518115b](https://github.com/dehero/mwscr/commit/518115b25a15272310f170bce0d2856f8a374c2c))
- **site:** use correct link to user's published posts
  ([e2eb30b](https://github.com/dehero/mwscr/commit/e2eb30bf964acbe73ae0a15276f3507f2a16299b))

## [1.4.0](https://github.com/dehero/mwscr/compare/v1.3.1...v1.4.0) (2024-07-09)

### Features

- **site:** implement project's site ([#61](https://github.com/dehero/mwscr/issues/61))
  ([286e271](https://github.com/dehero/mwscr/commit/286e271196fc784c7a2885b1f276aeb46409d246))

## [1.3.1](https://github.com/dehero/mwscr/compare/v1.3.0...v1.3.1) (2024-07-09)

### Bug Fixes

- find right first unpublished post after the publishing gap
  ([cbc7873](https://github.com/dehero/mwscr/commit/cbc787319f9f95f1bfe402cd9592be4cb5085f32))

## [1.3.0](https://github.com/dehero/mwscr/compare/v1.2.1...v1.3.0) (2024-06-09)

### Features

- **site:** add "JPEG artifacts" and "No anti-aliasing" violations
  ([5cd4c31](https://github.com/dehero/mwscr/commit/5cd4c318962cd2835b72d9d9694d8d6ab0aa608c))

## [1.2.1](https://github.com/dehero/mwscr/compare/v1.2.0...v1.2.1) (2024-05-13)

### Code Refactoring

- rename local github-issues folder to github-issue-resolvers
  ([13f1298](https://github.com/dehero/mwscr/commit/13f12983f6b629f24fbf3013435aa46d546fc1d0))
- rename local services folder to posting-service-managers
  ([64e53dc](https://github.com/dehero/mwscr/commit/64e53dc35834c7fb0e0a558a778c66f901e2b0f9))
- rewrite services as classes
  ([3db1bdf](https://github.com/dehero/mwscr/commit/3db1bdfc4a545cd9d6966a01bacb367c00a637a5))

## [1.2.0](https://github.com/dehero/mwscr/compare/v1.1.2...v1.2.0) (2024-04-19)

### Features

- add location mentioning to VK post captions
  ([44e3f5a](https://github.com/dehero/mwscr/commit/44e3f5ac79b54cc673278cb7ffe0ad32d26e2870))
- make locations more detailed
  ([b24e501](https://github.com/dehero/mwscr/commit/b24e5012e64bc164d1e9fb7be4a4cc647257218b))

### Bug Fixes

- skip mentioning location same as post title in post caption
  ([c63aa9a](https://github.com/dehero/mwscr/commit/c63aa9a4a9ff6abde480b1618f2992fa8805111a))

### Documentation

- update references to locations data file
  ([0f20c0f](https://github.com/dehero/mwscr/commit/0f20c0f6f8cd004edade0aec779780c4bd78e688))

## [1.1.2](https://github.com/dehero/mwscr/compare/v1.1.1...v1.1.2) (2024-04-19)

### Code Refactoring

- extract basic GitHub issue logic to core
  ([c2f6864](https://github.com/dehero/mwscr/commit/c2f6864b33e1ce7285b407571f87579e304d3a93))

## [1.1.1](https://github.com/dehero/mwscr/compare/v1.1.0...v1.1.1) (2024-04-18)

### Code Refactoring

- extract basic service functions to core
  ([22a4348](https://github.com/dehero/mwscr/commit/22a434829fffa6a33fa9fbe5bbf2482815a8aea9))
- move all sources using node dependencies to local folder, others to core
  ([363033c](https://github.com/dehero/mwscr/commit/363033c6e76ab94221e0c4847a64cc62862be4c0))

## [1.1.0](https://github.com/dehero/mwscr/compare/v1.0.0...v1.1.0) (2024-04-15)

### Features

- implement posts location check
  ([93382c2](https://github.com/dehero/mwscr/commit/93382c275ded90bc51e9c27ff9adc1ae1ca0fdc6))

### Bug Fixes

- add preview maintenance step after resolving GitHub issue
  ([489ec84](https://github.com/dehero/mwscr/commit/489ec8424b3146c8a52ba3569bed21c1a2f178b2))

### Continuous Integration

- fetch tags before release checking
  ([7946fb7](https://github.com/dehero/mwscr/commit/7946fb755753642b26e21db2f76735df537850d1))

### Documentation

- fix storage named as repository
  ([3b5b700](https://github.com/dehero/mwscr/commit/3b5b700fe62f13878d6be9a3e0887eaaa7cac5ab))

## 1.0.0 (2024-04-05)

Initial release.
