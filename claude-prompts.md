# Claude Prompts — RN Starter Kit

Paste these prompts directly into Claude (or Copilot) when building out each layer of a new app. Replace `[BRACKETS]` with your app-specific values before sending.

---

## 1. Scaffold a new screen

```
I'm building a React Native app with Expo Router, TypeScript, and Supabase.
Create a new screen at app/[SCREEN_NAME].tsx.

Requirements:
- Stack screen (no tabs)
- Uses useAuth() from context/AuthContext.tsx to check session
- If unauthenticated, redirect to app/login.tsx using expo-router's router.replace()
- Main content: [DESCRIBE YOUR SCREEN CONTENT]
- Style with StyleSheet.create (no external UI library)
- Include loading state while auth check resolves
```

---

## 2. Wire up the paywall to a gated screen

```
I have a paywall at components/paywall/PaywallScreen.tsx and a subscription screen I want to gate.

The screen is at app/[SCREEN_NAME].tsx.

Add the following logic to that screen:
- Import a boolean `isPro` from context or AsyncStorage (key: "is_pro")
- If isPro is false, render <PaywallScreen onSuccess={() => setIsPro(true)} onDismiss={() => router.back()} />
- If isPro is true, render the main screen content
- isPro should default to false and be checked on mount

Use the existing PaywallScreen component. Do not add any new IAP logic — that lives in services/IAPService.ts.
```

---

## 3. Add a new IAP product

```
I'm adding a new subscription tier to my React Native app using react-native-iap.

In constants/iap.ts:
- Add a new entry to PRODUCT_IDS: "[YOUR_PRODUCT_ID]"
- Add a new entry to PLANS: { id: "[YOUR_PRODUCT_ID]", label: "[LABEL]", price: "[PRICE]", period: "[PERIOD]", highlight: false }

Do not touch services/IAPService.ts or PaywallScreen.tsx — they already read from PRODUCT_IDS and PLANS dynamically.

Remind me to also create this product in App Store Connect with the exact same ID before testing.
```

---

## 4. Add Supabase auth (email/password)

```
I'm using Supabase for auth in a React Native Expo app.
The Supabase client is already set up at lib/supabase.ts.
AuthContext is at context/AuthContext.tsx and exposes { session, user, loading, signOut }.

Create a login screen at app/login.tsx with:
- Email + password inputs
- Sign In button that calls supabase.auth.signInWithPassword()
- Sign Up button that calls supabase.auth.signUp()
- Error message display
- On success, navigate to app/index.tsx with router.replace("/")
- Loading state on buttons during request
- No external UI libraries — use StyleSheet.create
```

---

## 5. Write to Supabase after a purchase

```
In my React Native app, after a successful IAP purchase I want to write to Supabase.

The purchase success callback is inside the iapService.init() call in app/_layout.tsx.
The Supabase client is at lib/supabase.ts.
The authenticated user is available via supabase.auth.getUser().

Inside the onPurchaseSuccess callback in _layout.tsx:
- Get the current user: const { data: { user } } = await supabase.auth.getUser()
- Upsert a row to a table called "subscriptions" with:
    - user_id: user.id
    - product_id: purchase.productId
    - purchased_at: new Date().toISOString()
    - is_active: true
- Log errors but do not crash the app if the write fails

Show me only the changes to _layout.tsx.
```

---

## 6. Debug a launch crash

```
My React Native iOS app (Expo SDK [VERSION]) is crashing on launch in production.
I'm using EAS Build. The crash happens before any screen renders.

Here is my app/_layout.tsx: [PASTE FILE]
Here is my app.json: [PASTE FILE]
Here is my eas.json: [PASTE FILE]

The error from Xcode / crash logs is: [PASTE ERROR]

Check for:
1. Any async calls happening outside useEffect (module-level async)
2. Missing SplashScreen.preventAutoHideAsync() at top of _layout
3. Native modules (IAP, camera, etc.) being called before mount
4. Missing or mismatched bundleIdentifier between app.json and eas.json
5. Fonts not guarded before render

Suggest specific fixes with line references.
```

---

## 7. Configure EAS build for first TestFlight submission

```
I'm submitting my first iOS build via EAS. My setup:
- eas.json is configured with development, preview, and production profiles
- App Store Connect app created with bundle ID: [BUNDLE_ID]
- Apple Developer account: [APPLE_ID]
- ASC App ID: [ASC_APP_ID] (found in App Store Connect → App Information)

Walk me through:
1. The exact eas build command for a production build
2. The exact eas submit command to send to TestFlight
3. What to check in App Store Connect after submission
4. Common reasons the build gets rejected at this step
```
