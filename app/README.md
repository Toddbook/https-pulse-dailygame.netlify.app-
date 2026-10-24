# PULSE Daily phone apps

The iOS and Android apps are built with [Capacitor](https://capacitorjs.com) from the same `public/index.html` the website uses,
so a change to the game reaches the site and the apps together. The game file is packed inside the app, so it plays with no internet.

## What is different in the app

`scripts/build-www.mjs` copies `public/index.html` into `app/www` and changes a few things:

- Fonts load from `static/fonts` instead of Google, so the app looks right offline.
- PULSE+ is always off. App stores don't allow subscriptions sold through Stripe, so the PULSE+ box, plans, archive and practice buttons are hidden (`static/app.css`).
- Sign-up links, the visitor counter and the FAQ are hidden, the game sits at the top of the screen, and the phone is locked to portrait.
- The Share button opens the phone's share sheet (`static/app.js`).

If the website file changes so one of these edits no longer matches, the build stops with a message instead of shipping a broken app.

## Building

GitHub builds both apps on every push that touches the game or `app/` (Actions > Mobile app). No Mac is needed.
The Android run produces a Play Store bundle (`.aab`) and a test APK you can install on an Android phone.

On your own computer (Node 22+, plus Android Studio and/or Xcode):

```
cd app
npm install
npm run sync          # rebuild www from public/index.html and copy it into both apps
npx cap open android  # or: npx cap open ios
```

To change the icon or splash screen: `node scripts/make-icons.cjs assets`, then `npm run assets`.

## Releasing

Bump `"version"` in `app/package.json` for each store release. Build numbers come from the GitHub run number.

### Secrets to add once the developer accounts exist

GitHub repo > Settings > Secrets and variables > Actions > New repository secret.

Android (upload key, made once and kept safe forever):

| Secret | What it is |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | The upload keystore file, base64 encoded |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password |
| `ANDROID_KEY_ALIAS` | Key alias, e.g. `upload` |
| `ANDROID_KEY_PASSWORD` | Key password |
| `PLAY_SERVICE_ACCOUNT_JSON` | Play Console service account JSON key |

Apple:

| Secret | What it is |
| --- | --- |
| `APPLE_TEAM_ID` | 10-character Team ID from developer.apple.com > Membership |
| `APP_STORE_CONNECT_KEY_ID` | Key ID of an App Store Connect API key with the Admin role |
| `APP_STORE_CONNECT_ISSUER_ID` | Issuer ID shown above the keys list |
| `APP_STORE_CONNECT_API_KEY` | Full text of the downloaded `.p8` file |

Then run Actions > Mobile app > Run workflow with "upload" ticked. Google Play needs the very first bundle uploaded by hand
in Play Console (download it from the run's artifacts); after that the workflow uploads to internal testing as a draft.
The app ID is `com.pulsedaily.app` on both stores. It can't be changed after the first upload.
