# Changelog

All notable changes to this project will be documented in this file.

## [1.23.1](https://github.com/dehero/mwscr/compare/v1.23.0...v1.23.1) (2024-12-04)

### Bug Fixes

- don't include package.json in bundle
  ([c63f46e](https://github.com/dehero/mwscr/commit/c63f46eac20a00f3d88bde152c4667e9b513976c))

## [1.23.0](https://github.com/dehero/mwscr/compare/v1.22.0...v1.23.0) (2024-12-04)

### Features

- extract data from JS bundle
  ([8b580a9](https://github.com/dehero/mwscr/commit/8b580a9c4e39f0996283e001da439dac604cae91))

### Performance Improvements

- evaluate dynamic data extraction
  ([d61d557](https://github.com/dehero/mwscr/commit/d61d557f76523e8687e1fd806b6f76f763af372e))

## [1.22.0](https://github.com/dehero/mwscr/compare/v1.21.0...v1.22.0) (2024-10-22)

### Features

- add author and requester tooltips on post page
  ([12b4abc](https://github.com/dehero/mwscr/commit/12b4abcf253450a1b22d8f90ae8521332d3a4d7f))

## [1.21.0](https://github.com/dehero/mwscr/compare/v1.20.3...v1.21.0) (2024-10-21)

### Features

- load post infos and user infos as resources
  ([d10ab1d](https://github.com/dehero/mwscr/commit/d10ab1d01830f82ecfd7d1ccb1fef619e7277e92))

### Bug Fixes

- use posts and users server selection info while hydrating
  ([ca77580](https://github.com/dehero/mwscr/commit/ca7758078d44d0eae5975b065c8e9b1d1cef08aa))
- use Yandex.Metrika only for production
  ([4d99efe](https://github.com/dehero/mwscr/commit/4d99efe78cc4cd23dd6e14dc27dc8ea191d8987b))

## [1.20.3](https://github.com/dehero/mwscr/compare/v1.20.2...v1.20.3) (2024-10-15)

### Bug Fixes

- find violation value by id while resolving GitHub issues
  ([b785ede](https://github.com/dehero/mwscr/commit/b785ede9547e59cda1068b17c00ad9d32dc9f7fc))

## [1.20.2](https://github.com/dehero/mwscr/compare/v1.20.1...v1.20.2) (2024-10-09)

### Continuous Integration

- export SITE_FTP_PATH secret to environment variables
  ([56e421b](https://github.com/dehero/mwscr/commit/56e421bd789247451f43a946cf25c2dd8c81b384))

## [1.20.1](https://github.com/dehero/mwscr/compare/v1.20.0...v1.20.1) (2024-10-09)

### Continuous Integration

- use Node.js to deploy site
  ([e267c96](https://github.com/dehero/mwscr/commit/e267c96565dc60227bca213337b8be65decc52a9))

## [1.20.0](https://github.com/dehero/mwscr/compare/v1.19.0...v1.20.0) (2024-10-02)

### Features

- implement optimized data extractor for site
  ([9aafc3f](https://github.com/dehero/mwscr/commit/9aafc3fe30a6d02650394165ab02d76dc4ee888f))

### Bug Fixes

- add missing post tags editing
  ([0fc7d51](https://github.com/dehero/mwscr/commit/0fc7d51d22765a8e804038fb0eb25628e31757ed))

## [1.19.0](https://github.com/dehero/mwscr/compare/v1.18.1...v1.19.0) (2024-09-30)

### Features

- support many locations for single post
  ([3cd0036](https://github.com/dehero/mwscr/commit/3cd0036dac407acc56907c50cf209b9d9ebbc29c))

## [1.18.1](https://github.com/dehero/mwscr/compare/v1.18.0...v1.18.1) (2024-09-30)

### Bug Fixes

- save Promise not result to DataExtractor cache
  ([d196f34](https://github.com/dehero/mwscr/commit/d196f342ca3e59ecb7ea5bb306bc67516d34d412))

## [1.18.0](https://github.com/dehero/mwscr/compare/v1.17.3...v1.18.0) (2024-09-30)

### Features

- add and use LocationInfo and UserInfo functions in DataExtractor
  ([5066684](https://github.com/dehero/mwscr/commit/50666849f543e6efcb176bfad8756d08c0858a61))
- add virtual scroll and selectable rows to Table
  ([7cadb54](https://github.com/dehero/mwscr/commit/7cadb547326aeddd8a1a89f612a7e26800b55822))
- allow Spacer to use any HTML tag
  ([796ac75](https://github.com/dehero/mwscr/commit/796ac750ae7e8c2d5c0959e9d676acb5f93c7ea0))
- implement Table virtualization, icons and tooltips
  ([63f31bb](https://github.com/dehero/mwscr/commit/63f31bb22c810ce0c7cb6d1a33a5cc20b27b11c9))
- **map:** add Locations and Map tabs to posts selection parameters
  ([095d7d3](https://github.com/dehero/mwscr/commit/095d7d3e5172b63cbbe88f6abb1b6f4ddc26b97d))
- **map:** add world map to post page
  ([1de8e9b](https://github.com/dehero/mwscr/commit/1de8e9be1acc3b817469ddf75461d4cc675c08a3))
- **map:** add WorldMap compass and remove non-vanilla location selection
  ([c990f7b](https://github.com/dehero/mwscr/commit/c990f7bf5aa34996e52a90e403a8f40e61a806cf))
- **map:** extend LocationInfo
  ([dedb0a6](https://github.com/dehero/mwscr/commit/dedb0a668005693a00000164967e14f3430d2df5))
- **map:** implement map grabbing with cursor
  ([aba7e77](https://github.com/dehero/mwscr/commit/aba7e7751c2fb717c075f01011739f341ba370d8))
- **map:** implement WorldMap component
  ([2320c3a](https://github.com/dehero/mwscr/commit/2320c3a7ec8928cf1fcd590ffe71edc793df4750))
- **map:** improve WorldMap rendering speed
  ([042a031](https://github.com/dehero/mwscr/commit/042a031dbb9af33e22aa062fd847ebf2988c1887))

### Bug Fixes

- consider nested locations when calculating location post count
  ([20052e2](https://github.com/dehero/mwscr/commit/20052e20bc43543c91bcfff0e8397193feeee5fd))
- **map:** don't use page scroll when scrolling to current location
  ([e06d271](https://github.com/dehero/mwscr/commit/e06d2719fc05ca939da4b3270d172a6e0e39442d))

### Code Refactoring

- rename UserContribution type and functions to PostsUsage
  ([4bc0316](https://github.com/dehero/mwscr/commit/4bc0316fb59045c9999e3dffc25aac108c43c336))
- use PostsManagerName type and don't create LocationInfo inside PostInfo
  ([f73c076](https://github.com/dehero/mwscr/commit/f73c076a1f3ae79b8e259a64b240f563d6a1b57b))

## [1.17.3](https://github.com/dehero/mwscr/compare/v1.17.2...v1.17.3) (2024-09-23)

### Code Refactoring

- implement and use data extractor
  ([9b73684](https://github.com/dehero/mwscr/commit/9b7368433b4c7020e14d84b68513ce2daca6efe7))

## [1.17.2](https://github.com/dehero/mwscr/compare/v1.17.1...v1.17.2) (2024-09-23)

### Documentation

- update violation list, inbox references and roadmap markup
  ([e9c16ec](https://github.com/dehero/mwscr/commit/e9c16ec3b1a78f4e6e22756c4102cddec017a54e))

## [1.17.1](https://github.com/dehero/mwscr/compare/v1.17.0...v1.17.1) (2024-09-19)

### Bug Fixes

- allow up to 4 post reactions update failures
  ([a83b05c](https://github.com/dehero/mwscr/commit/a83b05ca82d82b5554d1a9f56baf131550b8d152))

## [1.17.0](https://github.com/dehero/mwscr/compare/v1.16.5...v1.17.0) (2024-09-19)

### Features

- add "Unclear request" violation
  ([f1f27df](https://github.com/dehero/mwscr/commit/f1f27df1447e254329b8861825c90abbbf15a9d2))

### Continuous Integration

- use single concurrency group to all workflows
  ([c01c15d](https://github.com/dehero/mwscr/commit/c01c15d082d2822d47e31d34f01b8925c37475f6))

## [1.16.5](https://github.com/dehero/mwscr/compare/v1.16.4...v1.16.5) (2024-09-18)

### Bug Fixes

- improve creating user IDs ([ed3368c](https://github.com/dehero/mwscr/commit/ed3368c42565960f705b3ab7b581523c422f451f))

## [1.16.4](https://github.com/dehero/mwscr/compare/v1.16.3...v1.16.4) (2024-09-18)

### Continuous Integration

- make maintenance script wait for previous to complete
  ([d6852e1](https://github.com/dehero/mwscr/commit/d6852e10e1c1ce36be1cc2450a31cdc850589028))

## [1.16.3](https://github.com/dehero/mwscr/compare/v1.16.2...v1.16.3) (2024-09-18)

### Bug Fixes

- improve list item merging error text
  ([d6abbea](https://github.com/dehero/mwscr/commit/d6abbea2611fde47b236776abad29cb453ac4a4d))

## [1.16.2](https://github.com/dehero/mwscr/compare/v1.16.1...v1.16.2) (2024-09-18)

### Continuous Integration

- add TELEGRAM_BOT_ACCESS_TOKEN secret to workflow
  ([35b7e96](https://github.com/dehero/mwscr/commit/35b7e962aa8f053305aa58a48f413adcb318b18f))

## [1.16.1](https://github.com/dehero/mwscr/compare/v1.16.0...v1.16.1) (2024-09-18)

### Bug Fixes

- improve Telegram bot logs ([638cbb1](https://github.com/dehero/mwscr/commit/638cbb1e36710a6f25f15a3722c5711346f10e74))

## [1.16.0](https://github.com/dehero/mwscr/compare/v1.15.0...v1.16.0) (2024-09-18)

### Features

- add proposal and request buttons to home page
  ([4616e31](https://github.com/dehero/mwscr/commit/4616e3147035d401f9cfce9cc909a6b2ad785cf6))
- implement Telegram bot that accepts works
  ([08eb7a5](https://github.com/dehero/mwscr/commit/08eb7a59e1dec079138c35f09f1f34a9c326f09c))

### Documentation

- mention Telegram bot that accepts works
  ([9d74e64](https://github.com/dehero/mwscr/commit/9d74e644c3062878eaf38b19c2780a87c53f409e))

## [1.15.0](https://github.com/dehero/mwscr/compare/v1.14.0...v1.15.0) (2024-08-29)

### Features

- implement post review and merge dialogs
  ([150ff46](https://github.com/dehero/mwscr/commit/150ff46def51a4eb4a02942e2a1f27be89c3ab21))

## [1.14.0](https://github.com/dehero/mwscr/compare/v1.13.1...v1.14.0) (2024-08-29)

### Features

- add scrollbars styling ([145c65f](https://github.com/dehero/mwscr/commit/145c65fcf14a2092379b09ca9a8e62bae95f2f6e))
- implement post editing dialog
  ([8dfaabe](https://github.com/dehero/mwscr/commit/8dfaabe8ff03f15f9619df7e9cfd865baf3e6df9))

### Bug Fixes

- don't load locations until locations dialog is shown
  ([fb42e48](https://github.com/dehero/mwscr/commit/fb42e48db6a1b94a1a7c66964aa79034e8094a09))
- don't show unaccepted select value
  ([0fb0adf](https://github.com/dehero/mwscr/commit/0fb0adf08e9b8d1c57422d6e665717b00ce62584))
- remove extra margin under multiline input
  ([b30e6c7](https://github.com/dehero/mwscr/commit/b30e6c7c98ad844720b791a008f9f22652644442))

## [1.13.1](https://github.com/dehero/mwscr/compare/v1.13.0...v1.13.1) (2024-08-28)

### Bug Fixes

- allow creating previews for .webp and .jpg images
  ([2153730](https://github.com/dehero/mwscr/commit/215373019530ee87736dcda861e64900a10134a6))
- move dialog covered by post content to top
  ([a5ee958](https://github.com/dehero/mwscr/commit/a5ee958038611835427886c6b6413f9c09aafef4))
- rename issue creating buttons and close dialogs on button click
  ([afeb139](https://github.com/dehero/mwscr/commit/afeb1393ab650c59beea27d498b4e36bfab948f2))
- resolve post page content overflow issues
  ([206717a](https://github.com/dehero/mwscr/commit/206717ad5bde517a8dcfe31e8d0d148b1577976f))

## [1.13.0](https://github.com/dehero/mwscr/compare/v1.12.0...v1.13.0) (2024-08-23)

### Features

- make diagrams vertical with values
  ([39cf115](https://github.com/dehero/mwscr/commit/39cf115921458a3a613420b9b6ed2938d2b4b086))

## [1.12.0](https://github.com/dehero/mwscr/compare/v1.11.3...v1.12.0) (2024-08-22)

### Features

- add followers and engagement diagrams and recent most engaging post to home page
  ([c43a22e](https://github.com/dehero/mwscr/commit/c43a22e46168fc0335605c75a1a39bff6326d049))
- implement basic Diagram component
  ([070241b](https://github.com/dehero/mwscr/commit/070241b30e22955bf54dde0b62d8e9ec2cd0a11d))
- reconstruct reactions and content scores for posts and users
  ([2629140](https://github.com/dehero/mwscr/commit/2629140de4cb43fff02189f0280a84c930b161db))

## [1.11.3](https://github.com/dehero/mwscr/compare/v1.11.2...v1.11.3) (2024-08-21)

### Bug Fixes

- count post rating as likes to followers ratio starting from 50 followers
  ([0263356](https://github.com/dehero/mwscr/commit/026335683615fbf66159675a0b0c33c050777466))

## [1.11.2](https://github.com/dehero/mwscr/compare/v1.11.1...v1.11.2) (2024-08-16)

### Bug Fixes

- disable grabbing manual posts
  ([b89923f](https://github.com/dehero/mwscr/commit/b89923f2bd6f13544321c8fbc6cd609b4da56744))

## [1.11.1](https://github.com/dehero/mwscr/compare/v1.11.0...v1.11.1) (2024-08-16)

### Bug Fixes

- use correct users data writing path
  ([9db4595](https://github.com/dehero/mwscr/commit/9db459506c11285eb0fe7cc6bcdee0296f35096d))

## [1.11.0](https://github.com/dehero/mwscr/compare/v1.10.1...v1.11.0) (2024-08-15)

### Features

- display average user ratings
  ([c787668](https://github.com/dehero/mwscr/commit/c78766804de71eff372ede16e405567044260efc))

### Bug Fixes

- mock dates for VK caption test
  ([b82efa6](https://github.com/dehero/mwscr/commit/b82efa6939ee521f163db13e7e9760932ca81d8e))

### Code Refactoring

- remove postNameFromTitle ([32897b6](https://github.com/dehero/mwscr/commit/32897b6219dc70423c6b477b844c8ede341b1983))
- rename DataReader and DataManager to ListReader and ListManager
  ([a36a99b](https://github.com/dehero/mwscr/commit/a36a99b9e09c67be49551d330d0aae40febb2b62))
- use better namings for post managers and reactions
  ([82099bd](https://github.com/dehero/mwscr/commit/82099bd4eb7272d3fa478047210257be5a16703d))

## [1.10.1](https://github.com/dehero/mwscr/compare/v1.10.0...v1.10.1) (2024-08-15)

### Bug Fixes

- don't count reposts when calculating total reactions
  ([dc93774](https://github.com/dehero/mwscr/commit/dc93774733e53c1b4c7732488c113b48d385ecc0))

## [1.10.0](https://github.com/dehero/mwscr/compare/v1.9.3...v1.10.0) (2024-08-14)

### Features

- display total reactions on home page
  ([75fb55a](https://github.com/dehero/mwscr/commit/75fb55a4785f18257126673ed76a9a36145864ee))

## [1.9.3](https://github.com/dehero/mwscr/compare/v1.9.2...v1.9.3) (2024-08-13)

### Bug Fixes

- use image width when resizing for Instagram
  ([2a17172](https://github.com/dehero/mwscr/commit/2a17172add44bc770f8193450927cc7329b383b0))

## [1.9.2](https://github.com/dehero/mwscr/compare/v1.9.1...v1.9.2) (2024-08-13)

### Bug Fixes

- resize wallpapers when publishing to Instagram
  ([4291f96](https://github.com/dehero/mwscr/commit/4291f96f9fa608eaa4912ad835df0fed0842aaf0))

## [1.9.1](https://github.com/dehero/mwscr/compare/v1.9.0...v1.9.1) (2024-08-13)

### Bug Fixes

- allow posting wallpapers on tuesday
  ([c8a46dd](https://github.com/dehero/mwscr/commit/c8a46ddfcaa20292f72ce1e22bed0206a00e2313))

## [1.9.0](https://github.com/dehero/mwscr/compare/v1.8.3...v1.9.0) (2024-08-13)

### Features

- add blurred background for vertical post previews
  ([ffdfea6](https://github.com/dehero/mwscr/commit/ffdfea600557129e3b63300dff8c5e67cb979a8c))
- display post type titles ([4dfe4d0](https://github.com/dehero/mwscr/commit/4dfe4d0e691d93bb749a6aa956cd46ad5fa162e5))

## [1.8.3](https://github.com/dehero/mwscr/compare/v1.8.2...v1.8.3) (2024-08-13)

### Bug Fixes

- redeploy site on issue resolution
  ([2bc2867](https://github.com/dehero/mwscr/commit/2bc28672c16ac0e3bb8175c9f0f7fae2802a57eb))

## [1.8.2](https://github.com/dehero/mwscr/compare/v1.8.1...v1.8.2) (2024-08-13)

### Bug Fixes

- replace object tags with img
  ([bf4ff0d](https://github.com/dehero/mwscr/commit/bf4ff0dd080c779bfd38a9a3f85713d8157a0a1a))

## [1.8.1](https://github.com/dehero/mwscr/compare/v1.8.0...v1.8.1) (2024-08-12)

### Bug Fixes

- location placeholder should not be empty
  ([62c5ab9](https://github.com/dehero/mwscr/commit/62c5ab93619e5c0711f824cf506583c6a941018f))

## [1.8.0](https://github.com/dehero/mwscr/compare/v1.7.3...v1.8.0) (2024-08-12)

### Features

- add license information ([e639dc6](https://github.com/dehero/mwscr/commit/e639dc63093bf9b86ffa4707f09a1e97c8eb3507))

## [1.7.3](https://github.com/dehero/mwscr/compare/v1.7.2...v1.7.3) (2024-08-11)

### Bug Fixes

- get last posts by Date instead of ID
  ([3e203c5](https://github.com/dehero/mwscr/commit/3e203c56f9bca7f1bc2793fbdd20a5567f3878da))

## [1.7.2](https://github.com/dehero/mwscr/compare/v1.7.1...v1.7.2) (2024-08-09)

### Bug Fixes

- pre-render links on user site page
  ([1a4ba42](https://github.com/dehero/mwscr/commit/1a4ba427ab7fc700ada03152aa010a0571157088))

## [1.7.1](https://github.com/dehero/mwscr/compare/v1.7.0...v1.7.1) (2024-08-09)

### Bug Fixes

- adjust references after renaming published to posts
  ([d844cef](https://github.com/dehero/mwscr/commit/d844cefa4dd2f78cb515e73b67dbda3f77988e0b))
- don't show post requests in the shortlist
  ([382819b](https://github.com/dehero/mwscr/commit/382819ba7e3d9145286afa465b18c6ac00c49abc))
- improve requested posts filter description
  ([12b73a3](https://github.com/dehero/mwscr/commit/12b73a334ce41008da71df5a04ee44da5c0fe00c))
- use location GitHub issues to locate posts on site
  ([d8180c3](https://github.com/dehero/mwscr/commit/d8180c3b46afed7e7149d8a596d4e005fb971d60))

### Code Refactoring

- rename drawing post type to redrawing
  ([d87459b](https://github.com/dehero/mwscr/commit/d87459b8336c7296913a574c5585418703a85762))

### Documentation

- mark wallpaper and wallpaper-v post types as implemented
  ([70a00b7](https://github.com/dehero/mwscr/commit/70a00b7e00b2e47491a2e8858123ce843713cdf7))

## [1.7.0](https://github.com/dehero/mwscr/compare/v1.6.1...v1.7.0) (2024-08-09)

### Features

- **wallpaper:** add basic support for wallpaper and wallpaper-v post types
  ([cb586e1](https://github.com/dehero/mwscr/commit/cb586e162548709f5e536698901faf0a7d825bce))
- **wallpaper:** implement wallpaper publishing
  ([88eeba2](https://github.com/dehero/mwscr/commit/88eeba22014a444ee1b7250e05bf0047f0051c9b))

### Documentation

- **wallpaper:** add information about wallpaper and wallpaper-v post types
  ([e29791e](https://github.com/dehero/mwscr/commit/e29791eefc7616af3b6acef9ca4a415fc9ca5090))

## [1.6.1](https://github.com/dehero/mwscr/compare/v1.6.0...v1.6.1) (2024-08-06)

### Bug Fixes

- add missing filters and sort fields
  ([037304e](https://github.com/dehero/mwscr/commit/037304e0e39f9329b1dc83c2e4e0b014c51c2570))

## [1.6.0](https://github.com/dehero/mwscr/compare/v1.5.2...v1.6.0) (2024-08-06)

### Features

- implement Calendar component
  ([e1657f3](https://github.com/dehero/mwscr/commit/e1657f38807bef41cd2ba23fd819125dbdd73484))
- implement DatePicker component
  ([213d2bc](https://github.com/dehero/mwscr/commit/213d2bc409b3253a2f4ac1c94040ec59652d1dbd))
- implement post date filtering and sorting
  ([31ee535](https://github.com/dehero/mwscr/commit/31ee5357a326adbcecabfd0b59e8804b9ea1f5dc))

### Bug Fixes

- correctly find published post date by id
  ([3823d20](https://github.com/dehero/mwscr/commit/3823d205824bd3971038b0002aca2a66672bb916))
- don't trigger Tooltip visibility through Dialog
  ([4db91fd](https://github.com/dehero/mwscr/commit/4db91fd3fee7720847c4b8c3824a1610754eddfa))
- improve original and publishable post filter labels
  ([298789b](https://github.com/dehero/mwscr/commit/298789b2545b7492d17044f756364fad49e9bb00))
- remove border on Frame for null variant
  ([f037d9d](https://github.com/dehero/mwscr/commit/f037d9dcfe11a14d97fcac18edfe77b6bf6fb0e0))

## [1.5.2](https://github.com/dehero/mwscr/compare/v1.5.1...v1.5.2) (2024-08-02)

### Code Refactoring

- remove dots from published post names
  ([b990c80](https://github.com/dehero/mwscr/commit/b990c80885985111dd84e946c357461644ad4635))
- rename "published" posts manager to "posts" with all links and mentions
  ([7a56f8e](https://github.com/dehero/mwscr/commit/7a56f8eafcfd4275d3e7487f3b91372b577f93a0))

## [1.5.1](https://github.com/dehero/mwscr/compare/v1.5.0...v1.5.1) (2024-08-01)

### Bug Fixes

- stop generating repeating reposts on total publishing fail caused by store read error
  ([c3cff54](https://github.com/dehero/mwscr/commit/c3cff542b4f35f58caefa166a154d9b0599d906d))

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
