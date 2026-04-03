# SETUP.md — New App Setup Checklist

Follow these steps IN ORDER every time you start a new app from this kit.
Do not skip ahead — each step depends on the one before it.

---

## PHASE 1 — Computer Tools (one-time installs)

These only need to be installed once on your machine. Skip if already done.

- [ ] **Node.js** → https://nodejs.org (install LTS version)
- [ ] **Git** → https://git-scm.com
- [ ] **EAS CLI** → `npm install -g eas-cli`
- [ ] **Expo CLI** → `npm install -g expo-cli`
- [ ] **Supabase CLI** → `scoop install supabase` (Windows) or `brew install supabase/tap/supabase` (Mac)
- [ ] **Expo Go app** on your iPhone (for daily development)

---

## PHASE 2 — Accounts (one-time setup)

- [ ] **Expo account** → https://expo.dev/signup
  - Then run: `eas login`
- [ ] **Supabase account** → https://supabase.com (free tier is fine)
  - Then run: `supabase login`
- [ ] **Apple Developer account** → https://developer.apple.com ($99/year)
  - Apple connects automatically through EAS during your first `eas build`

---

## PHASE 3 — Create the Project

```bash
# Navigate to your projects folder
cd C:\Users\aidaw\Desktop\Code

# Create the Expo project (this makes the folder for you)
npx create-expo-app YourAppName --template blank-typescript

# Enter the project
cd YourAppName
```

---

## PHASE 4 — Copy Kit Files

Copy these files/folders from the kit into your new project folder,
overwriting any defaults that create-expo-app generated:

```
app/_layout.tsx         ← replaces the default
app.json                ← replaces the default
eas.json                ← new file
babel.config.js         ← new file (required for reanimated)
metro.config.js         ← new file (mocks IAP for Expo Go)
.env.example            ← new file
context/                ← new folder
lib/                    ← new folder
services/               ← new folder
constants/              ← new folder
components/paywall/     ← new folder
mocks/                  ← new folder (react-native-iap mock)
```

Also replace `index.ts` with:
```ts
import "react-native-gesture-handler";
import "expo-router/entry";
```

---

## PHASE 5 — Install Dependencies

Run these in your project folder:

```bash
# Core Expo + navigation
npx expo install expo-router expo-splash-screen expo-font expo-build-properties
npx expo install expo-linking expo-constants expo-status-bar
npx expo install react-native-screens react-native-safe-area-context
npx expo install react-native-gesture-handler

# Reanimated (must match SDK — install exact version)
npm install react-native-reanimated@3.16.1 --legacy-peer-deps

# Babel preset (required by babel.config.js)
npm install babel-preset-expo --legacy-peer-deps

# Supabase + storage
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage

# In-app purchases
npx expo install react-native-iap
```

> ⚠️ If you get React version mismatch errors, pin React exactly:
> `npm install react@19.1.0 --save-exact --legacy-peer-deps`

---

## PHASE 6 — Fill In Placeholders

### app.json
- [ ] `name` → your app's display name (e.g. "ShopMyRoom")
- [ ] `slug` → lowercase-hyphenated (e.g. "shopmyroom")
- [ ] `scheme` → same as slug (e.g. "shopmyroom")
- [ ] `ios.bundleIdentifier` → e.g. `com.yourcompany.shopmyroom`
- [ ] `extra.eas.projectId` → get this after running `eas init` (step below)

### eas.json
- [ ] `appleId` → your Apple ID email
- [ ] `ascAppId` → from App Store Connect → App Information → Apple ID field
- [ ] `appleTeamId` → from https://developer.apple.com/account → Membership

### .env
- [ ] Copy `.env.example` to `.env`
- [ ] Fill in `EXPO_PUBLIC_SUPABASE_URL`
- [ ] Fill in `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Both found at: Supabase dashboard → Project Settings → API

### constants/iap.ts
- [ ] Replace all 3 product IDs with your real App Store Connect product IDs
- [ ] Update the `price` display values to match what you set in App Store Connect

---

## PHASE 7 — EAS + App Store Connect Setup

```bash
# Link your project to EAS (generates your projectId for app.json)
eas init
```

In App Store Connect (https://appstoreconnect.apple.com):
- [ ] Create a new App with your bundle ID
- [ ] Go to your app → Subscriptions → Create a Subscription Group
- [ ] Add 3 products matching your IDs in `constants/iap.ts`
- [ ] Set a price and duration for each
- [ ] Add a Localization to each product (display name + description)
- [ ] Go to Users & Access → Sandbox → Testers → add a sandbox tester email

---

## PHASE 8 — First Test in Expo Go

```bash
npx expo start --clear
```

- Scan QR code with Expo Go on your iPhone
- Verify auth, navigation, and paywall UI all load without errors
- IAP is mocked — paywall will show static prices from `constants/iap.ts`
- This is your daily development workflow

---

## PHASE 9 — Production Build & IAP Testing

```bash
# Build for TestFlight
eas build --platform ios --profile production

# Submit to TestFlight
eas submit --platform ios
```

On your test device:
- [ ] Sign out of your real Apple ID in Settings → App Store
- [ ] Sign in with your Sandbox Tester account
- [ ] Install the TestFlight build
- [ ] Open the app → trigger the paywall → complete a sandbox purchase
- [ ] Confirm the purchase flow completes without error

---

## PHASE 10 — You're Done

Your template is validated. For your next app:
- Start from Phase 3
- Phases 1 & 2 are already done
- Use `claude-prompts.md` to scaffold screens and features with Claude

---

## Troubleshooting

### React version mismatch (`react` vs `react-native-renderer`)
Pin React to match what react-native expects:
```bash
npm install react@19.1.0 --save-exact --legacy-peer-deps
```

### `react-native-iap` bundling error in Expo Go
The `metro.config.js` and `mocks/react-native-iap.js` handle this automatically.
Make sure both files are present in your project.

### `PlatformConstants` TurboModule crash in dev builds
This is a known issue with `react-native-iap` v13+ in dev builds.
Use Expo Go for development and production/TestFlight builds for IAP testing.
The `__DEV__` guards in `IAPService.ts` prevent IAP from initializing in dev.

### Build number already used (`eas submit` fails)
Increment `ios.buildNumber` in `app.json` and rebuild:
```bash
eas build --platform ios --profile production
```
