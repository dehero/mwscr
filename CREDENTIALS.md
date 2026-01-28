# Receiving Credentials

This document contains help information for administrator to connect repository to project's accounts and store.

## Instagram

Go to
[Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=GET&path=me%3Ffields%3Did%2Cname&version=v18.0)
and fill in the following fields:

Application: mwscr  
Page: Morrowind Screenshots  
Permissions: `pages_show_list` `ads_management` `business_management` `instagram_basic` `instagram_manage_insights`
`instagram_content_publish` `pages_read_engagement` `instagram_manage_events` `instagram_manage_comments`

Click "Generate Access Token" and copy `ACCESS_TOKEN`.

Go to [application settings](https://developers.facebook.com/apps/884299399462391/settings/basic/) and copy "Application
ID" as `CLIENT_ID` and "Application secret" as `CLIENT_SECRET`.

Exchange `ACCESS_TOKEN`, `CLIENT_ID` and `CLIENT_SECRET` to long-live token by requesting URL:

```txt
https://graph.facebook.com/oauth/access_token?grant_type=fb_exchange_token&client_id=CLIENT_ID&client_secret=CLIENT_SECRET&fb_exchange_token=ACCESS_TOKEN
```

Copy resulting JSON field named `access_token` to `INSTAGRAM_ACCESS_TOKEN` environment variable.

## VK

Go to [My apps](https://vk.com/apps?act=manage), find "mwscr" application and select "Manage". There go to "Settings"
and copy "App ID" to `CLIENT_ID`, "Secure key" to `CLIENT_SECRET` and "Authorized redirect URI" to `REDIRECT_URI`.

Then call URL:

```txt
https://oauth.vk.com/authorize?client_id=CLIENT_ID&display=page&redirect_uri=REDIRECT_URI&scope=wall,photos&response_type=code&v=5.131
```

Authorize and copy `code` URL parameter of resulting URL address to `CODE`.

Exchange `CODE`, `CLIENT_ID`, `CLIENT_SECRET` and `REDIRECT_URI` to access token by requesting URL:

```txt
https://oauth.vk.com/access_token?client_id=CLIENT_ID&client_secret=CLIENT_SECRET&redirect_uri=REDIRECT_URL&code=CODE
```

Copy resulting JSON field named `access_token` to `VK_ACCESS_TOKEN` environment variable.

### Telegram

`TELEGRAM_PHONE_NUMBER` environment variable is known in advance.

Go to [App configuration](https://my.telegram.org/apps), copy "App api_id" to `TELEGRAM_API_APP_ID` and "App api_hash"
to `TELEGRAM_API_APP_HASH` environment variables.

Run in command line:

```bash
npm run script src/scripts/get-telegram-session.ts
```

Enter `PHONE CODE` when it will be asked for and copy final output to `TELEGRAM_SESSION` environment variable.

## YouTube

On Google Cloud open [Credentials](https://console.cloud.google.com/apis/credentials?project=mwscr-project). Press
"Create Credentials" button and choose "API key". Copy generated value to `YOUTUBE_API_KEY` environment variable.

## Yandex.Disk

Go to [Third party clients](https://oauth.yandex.com/) and click on "mwscr" application. Copy "ClientID" as `CLIENT_ID`.

Exchange `CLIENT_ID` to `YANDEX_DISK_ACCESS_TOKEN` environment variable by requesting URL:

```txt
https://oauth.yandex.ru/authorize?response_type=token&client_id=CLIENT_ID
```

`YANDEX_DISK_STORE_PATH` environment variable is known in advance.

## Reddit

Get `REDDIT_APP_NAME` and `REDDIT_APP_SECRET` on [developed applications](https://www.reddit.com/prefs/apps).
