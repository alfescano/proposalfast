# Native apps (iOS and Android)

ProposalFast ships a Capacitor 8 shell around the live site. The shell is a WebView pointed at `https://proposalfast.ai`. It is not a static export of the Next.js app, and it does not change the website or the installed PWA.

There is no Apple or Google listing in this repo. The ids below are the ones to create in the developer consoles. They cannot be changed after the first binary upload.

|                        |                                                       |
| ---------------------- | ----------------------------------------------------- |
| Display name           | ProposalFast                                          |
| iOS bundle id          | `ai.proposalfast.app`                                 |
| Android application id | `ai.proposalfast.app`                                 |
| Version                | `1.0` (`versionCode` / `CURRENT_PROJECT_VERSION` `1`) |
| Start URL              | `https://proposalfast.ai`                             |

## What is already in the repo

- `capacitor.config.ts` is the source of truth. `npm run cap:sync` copies it into the native projects.
- `android/` and `ios/` are the Capacitor projects, including the app icon and splash generated from `native/assets/logo.svg`.
- `native/www/` is a tiny local fallback. With a server URL set, the WebView opens the remote site instead of that file.
- HTTPS only. Android sets `usesCleartextTraffic="false"`. Mixed content is off. iOS App Transport Security keeps `NSAllowsArbitraryLoads` false.
- The WebView may navigate inside `proposalfast.ai` (and one subdomain label, such as `www` or `staging`). Google sign-in and Stripe Checkout / Customer Portal hosts stay in the WebView so the session cookie is still there when they redirect back. Any other site opens in the system browser.
- Status bar and splash use the site paper (`#f6f1e8`) and ink (`#152033`). The user agent is the normal WebView UA plus `ProposalFastShell`. The website does not branch on that token.

Capacitor documents `server.url` as a live-reload feature. This SaaS stays on the server because auth, Stripe, and the App Router are not a static bundle. The binary is the product (sign in, write a proposal, send, sign, pay), which is what App Review looks for under guideline 4.2. Budget time for a review note that says that.

## Local sync

From a checkout with dependencies installed:

```bash
npm install
npm run cap:sync
```

`cap:sync` reads `CAPACITOR_SERVER_URL` from the environment or from `.env` (via dotenv). Leave it unset for a store build. The default is `https://proposalfast.ai`.

Staging has to be https, and the host has to be `proposalfast.ai`, a subdomain (`staging.proposalfast.ai`), or a `*.vercel.app` preview:

```bash
CAPACITOR_SERVER_URL=https://staging.proposalfast.ai npm run cap:sync
```

The URL is compiled into the binary. Changing it means syncing again and shipping a new build. Do not point a Play or App Store binary at a preview URL.

Useful scripts:

| Script                      | What it does                                                   |
| --------------------------- | -------------------------------------------------------------- |
| `npm run cap:sync`          | Update both native projects from `capacitor.config.ts`         |
| `npm run cap:open:android`  | Open `android/` in Android Studio                              |
| `npm run cap:open:ios`      | Open `ios/App/App.xcodeproj` in Xcode (Mac only)               |
| `npm run cap:android:debug` | `cap sync android`, then `./gradlew assembleDebug`             |

Run `npm run cap:sync` before opening either IDE. Sync recreates files that are gitignored (`android/app/src/main/assets/public`, `android/capacitor-cordova-android-plugins`, `ios/App/App/public`).

To regenerate icons and splash after editing `native/assets/logo.svg`:

```bash
npx @capacitor/assets generate --ios --android --assetPath native/assets \
  --iconBackgroundColor '#152033' --iconBackgroundColorDark '#152033' \
  --splashBackgroundColor '#f6f1e8' --splashBackgroundColorDark '#152033'
```

Do not pass `--pwa`. That flag rewrites the website icons.

## Android debug APK (Linux CI or a local machine)

This does not need a Mac. It produces a debug-signed APK, which is not a Play upload.

Requirements:

- Node.js 22 or newer (Capacitor 8)
- JDK 21 (the Android project compiles as Java 21)
- Android SDK with `compileSdk` / `targetSdk` 36 and matching build-tools
- `ANDROID_HOME` (or `ANDROID_SDK_ROOT`) pointing at that SDK

```bash
npm ci
npm run cap:android:debug
```

Output:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

The debug APK is signed with the Android debug keystore on that machine. Install it with `adb install -r` on a device or emulator. It loads production unless you exported `CAPACITOR_SERVER_URL` before the sync step.

Play will reject a debug APK. Internal testing needs an Android App Bundle signed with the upload key (next section).

## Play Console (Alfredo)

1. Create the app with package name `ai.proposalfast.app` and name ProposalFast.
2. Turn on Play App Signing and let Google hold the app signing key. Create the upload key in Android Studio or `keytool` on your machine. Do not commit the keystore, passwords, or `android/local.properties`.
3. On a machine with Android Studio: `npm ci`, `npm run cap:sync`, `npm run cap:open:android`.
4. Build > Generate Signed Bundle / APK > Android App Bundle. Use the upload key.
5. Upload the `.aab` to the Internal testing track. Add testers, and install from the Play opt-in link.
6. Store listing needs your own screenshots, a short description, and the privacy policy URL `https://proposalfast.ai/privacy`. The Data safety form has to match the live site (account data, and payments handled by Stripe). This repo does not fill that form in.
7. `targetSdkVersion` is 36. Confirm Play's current target-API requirement before you submit to production.

## App Store (Mac required)

This repo was prepared on Linux. Nothing here has been archived in Xcode, signed with an Apple certificate, or uploaded to App Store Connect. Those steps need Alfredo's Mac and his Apple Developer account.

1. In [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources), register an explicit App ID with bundle id `ai.proposalfast.app`.
2. In App Store Connect, create the app with that bundle id and the name ProposalFast. SKU can be `proposalfast-ios`.
3. On the Mac:

   ```bash
   npm ci
   npm run cap:sync
   npm run cap:open:ios
   ```

   Capacitor 8 uses Swift Package Manager (`ios/App/CapApp-SPM`). You do not need CocoaPods unless a later plugin adds a Podfile.

4. In Xcode, select the App target > Signing & Capabilities. Choose the team. Leave signing Automatic. Xcode creates the development and distribution profiles. Do not commit profiles or certificates.
5. Set the version if it should differ from `1.0` / build `1` (`MARKETING_VERSION` and `CURRENT_PROJECT_VERSION` in the project).
6. Product > Archive, then Distribute App > App Store Connect. Upload.
7. In TestFlight, wait for processing, answer export compliance, and add internal testers. The shell only uses standard HTTPS. Server-side hashing in the website is not part of this binary. Confirm that against your own encryption review before you submit.
8. Privacy Nutrition Labels and the privacy policy URL (`https://proposalfast.ai/privacy`) are entered in App Store Connect. They should describe the live product, not an empty shell.
9. A review note can say the app is the ProposalFast workspace (account required) and that the UI is loaded from `https://proposalfast.ai`.

`npm run cap:open:ios` fails on Linux because there is no Xcode. `npm run cap:sync` does run on Linux and refreshes the iOS project.

## Sign-in and payments inside the shell

Email and password stay on `proposalfast.ai`, so they work in the WebView.

Google may refuse OAuth inside an embedded WebView (`disallowed_useragent`). The shell does not disguise the WebView user agent. If Google sign-in fails on a device, use email and password, and treat a system-browser return path as follow-up work. Do not "fix" it by stripping `wv` from the Android user agent.

Stripe Checkout (`checkout.stripe.com`) and the Customer Portal (`billing.stripe.com`) are allowed to stay in the WebView. Some bank 3-D Secure pages are on other hosts, so Android and iOS will open those in the system browser. The tester should return to ProposalFast after the bank step.

## Known limits

- The website does not add safe-area padding. Android uses Capacitor's native inset handling when the page has no `viewport-fit=cover`. iOS uses `contentInset: automatic`. If a header sits under the status bar on a device, fix that in the site later. It was left alone so the PWA layout does not change.
- The splash hides on its own after about 1.5 seconds. The remote page cannot call `SplashScreen.hide()` unless the site later loads `@capacitor/core`.
- No push notifications, no in-app purchases, and no custom URL scheme beyond the id Capacitor wrote into `android/app/src/main/res/values/strings.xml`. Store screenshots, age rating, and review replies are console work.
