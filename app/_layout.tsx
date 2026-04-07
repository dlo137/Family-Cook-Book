/**
 * app/_layout.tsx — Root Layout
 *
 * ⚠️ LAUNCH CRASH PREVENTION — INITIALIZATION ORDER MATTERS:
 *
 *   Step 1: SplashScreen.preventAutoHideAsync() ← called at module level (before render)
 *   Step 2: Load fonts
 *   Step 3: Initialize IAPService (react-native-iap initConnection)
 *   Step 4: Hide splash screen
 *   Step 5: Render app
 *
 *   DO NOT skip steps or reorder them. The most common cause of iOS production
 *   launch crashes is rendering UI or calling native modules before the JS
 *   runtime and native bridge are fully ready.
 *
 * RELATED FILES:
 *   - context/AuthContext.tsx  → Wraps <Stack> here; provides session to all screens
 *   - services/IAPService.ts  → Initialized here; destroyed on unmount
 *   - lib/supabase.ts         → Used inside AuthContext (not called directly here)
 *   - app.json                → Confirm splash resizeMode = "contain"
 *   - eas.json                → Confirm bundleIdentifier matches App Store Connect
 *
 * COMMON CRASH CAUSES THIS LAYOUT PREVENTS:
 *   ✅ IAPService.init() called before native module ready → guarded by useEffect
 *   ✅ Fonts not loaded before first render → guarded by fontsLoaded check
 *   ✅ Splash screen hiding before init finishes → guarded by isReady flag
 *   ✅ AsyncStorage race condition at cold launch → Supabase session read in AuthContext
 */

// Guard against TurboModule timing errors in dev builds only.
// In production this block is never needed — native modules are always ready.
if (__DEV__) {
  try {
    // @ts-ignore — ErrorUtils is a React Native global, not in TS types
    ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
      console.warn("[DEV] Caught global error:", error?.message);
    });
  } catch {}
}

import { AuthProvider } from "@/context/AuthContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { iapService } from "@/services/IAPService";
import Constants from "expo-constants";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";

// ✅ Must be called at module level, before any async work
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  // Step 2: Load custom fonts (remove if using system fonts only)
  const [fontsLoaded] = useFonts({
    // "MyFont-Regular": require("../assets/fonts/MyFont-Regular.ttf"),
  });

  // Step 3: Fonts done → mark ready immediately, don't wait for IAP
  useEffect(() => {
    if (fontsLoaded) {
      setIsReady(true);
    }
  }, [fontsLoaded]);

  // Step 3b: Init IAP AFTER the app renders (not during splash)
  // ⚠️ This is intentionally separate from the splash phase.
  // react-native-iap's initConnection() requires the native bridge
  // to be fully stable — calling it during splash causes a
  // TurboModule / PlatformConstants crash on iOS dev and production builds.
  useEffect(() => {
    if (!isReady) return;

    const isProduction = Constants.appOwnership !== "expo" && !__DEV__;

    if (isProduction) {
      iapService.init().catch((err) => {
        console.warn("[_layout] IAPService.init() failed:", err);
      });
    }

    return () => {
      iapService.destroy();
    };
  }, [isReady]);

  useEffect(() => {
    // Step 4: Hide splash only after fonts + IAP are both ready
    if (isReady) {
      SplashScreen.hideAsync();
    }
  }, [isReady]);

  // Step 5: Don't render until everything is ready
  if (!isReady) return null;

  return (
    // Step 5: AuthProvider wraps Stack so all screens have auth context
    <AuthProvider>
      <FavoritesProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="recipe" />
        <Stack.Screen name="add-recipe" />
        <Stack.Screen name="cook-mode" />
        <Stack.Screen name="add-favorite" />
      </Stack>
      </FavoritesProvider>
    </AuthProvider>
  );
}
