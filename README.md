# RN Starter Kit — React Native + Expo + Supabase + IAP

A personal template kit for spinning up iOS apps faster. Every file is pre-wired
and heavily commented so you spend zero time re-figuring out initialization order,
IAP hookup, or launch crash causes.

## Folder Structure

```
rn-starter-kit/
├── app.json                          # Expo config (EAS-safe)
├── eas.json                          # Build profiles (dev / preview / production)
├── babel.config.js                   # Babel config (required for react-native-reanimated)
├── metro.config.js                   # Metro config (mocks react-native-iap for Expo Go)
├── .env.example                      # Copy to .env, fill in Supabase keys
│
├── app/
│   ├── _layout.tsx                   # ⚠️ Root layout — safe init order (fonts → IAP → splash)
│   ├── index.tsx                     # Auth gate — redirects to home or onboarding
│   ├── onboarding.tsx                # First launch screen
│   ├── signup.tsx                    # Sign up / sign in form
│   ├── subscription.tsx              # Wraps PaywallScreen
│   └── (home)/
│       ├── _layout.tsx               # Home group layout
│       └── home.tsx                  # Main authenticated screen
│
├── context/
│   └── AuthContext.tsx               # Supabase auth state, session, signOut
│
├── lib/
│   └── supabase.ts                   # Supabase client (AsyncStorage session)
│
├── services/
│   └── IAPService.ts                 # react-native-iap: init, getProducts, purchase
│
├── constants/
│   └── iap.ts                        # Product IDs + plan metadata (edit these first)
│
├── components/
│   └── paywall/
│       └── PaywallScreen.tsx         # Paywall UI wired to IAPService + constants/iap.ts
│
├── mocks/
│   └── react-native-iap.js           # No-op mock used by Metro in Expo Go
│
└── claude-prompts.md                 # Ready-to-paste Claude prompts for each layer
```

## Quick Start for a New App

1. Copy this folder into your new Expo project
2. Replace all `YOUR_APP_NAME`, `yourappslug`, `com.yourcompany.yourapp` placeholders
3. Fill in `.env` from `.env.example`
4. Update `constants/iap.ts` with your real App Store Connect product IDs
5. Run `npx expo start` to test in Expo Go
6. Run `eas build --platform ios --profile production` for TestFlight/IAP testing
7. Use `claude-prompts.md` to scaffold screens, auth, and IAP with Claude

## Key Files to Edit First

| File | What to change |
|---|---|
| `app.json` | App name, slug, bundleIdentifier, EAS project ID |
| `eas.json` | Apple ID, ASC App ID, Team ID |
| `constants/iap.ts` | Your actual product IDs from App Store Connect |
| `.env` | Supabase URL + anon key |

## Development Workflow

### Expo Go (daily development — auth, UI, navigation)
```bash
npx expo start --clear
```
- Scan QR code with Expo Go app
- IAP is automatically mocked via `metro.config.js` — paywall shows static prices
- Auth, navigation, and all non-IAP features work normally

### Production / TestFlight (IAP testing)
```bash
eas build --platform ios --profile production
eas submit --platform ios
```
- IAP mock is disabled for EAS builds (`EAS_BUILD` env var is set)
- Real `react-native-iap` module is used
- Test purchases with a Sandbox Tester account

## IAP: Expo Go vs Production

| Feature | Expo Go | Production/TestFlight |
|---|---|---|
| Auth (Supabase) | ✅ Works | ✅ Works |
| Navigation | ✅ Works | ✅ Works |
| Paywall UI | ✅ Shows static prices | ✅ Shows live App Store prices |
| Purchase flow | ❌ No-op (mocked) | ✅ Real purchases |
| Restore purchases | ❌ No-op (mocked) | ✅ Real restore |

## IAP Testing Checklist

- [ ] Products created in App Store Connect with matching IDs
- [ ] Each product has a Localization added
- [ ] Sandbox Tester created in App Store Connect
- [ ] Signed out of real Apple ID on test device
- [ ] Using a real device (not simulator, not Expo Go)
- [ ] Using a TestFlight or production build

## Launch Crash Checklist

- [ ] `SplashScreen.preventAutoHideAsync()` is at module level in `_layout.tsx`
- [ ] `IAPService.init()` is inside a `useEffect`, not at module level
- [ ] `SplashScreen.hideAsync()` only called after fonts + IAP are both ready
- [ ] `supabase.auth.getSession()` is inside a `useEffect` in `AuthContext.tsx`
- [ ] `bundleIdentifier` in `app.json` matches what's in App Store Connect
- [ ] No async/await calls at the top level of any module
