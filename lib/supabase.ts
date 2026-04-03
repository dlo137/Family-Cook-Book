/**
 * lib/supabase.ts — Supabase Client
 *
 * RELATED FILES:
 *   - context/AuthContext.tsx  → Consumes the supabase client for auth state
 *   - app/_layout.tsx          → AuthContext wraps the app here
 *   - .env                     → EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY
 *
 * SETUP:
 *   1. Create a project at https://supabase.com
 *   2. Copy your URL + anon key into .env (never hard-code them)
 *   3. Install: npx expo install @supabase/supabase-js expo-secure-store
 *
 * ⚠️ LAUNCH CRASH NOTE:
 *   expo-secure-store is synchronous on first read but async on write.
 *   Do NOT call supabase.auth.getSession() at module load time — do it
 *   inside AuthContext after the component mounts, or you risk a crash
 *   on cold launch in production.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "[supabase.ts] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
