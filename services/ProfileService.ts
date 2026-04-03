import { supabase } from "@/lib/supabase";
import type { Purchase } from "react-native-iap";

/** Called after signup — upserts the profile row as a safety net alongside the DB trigger */
export async function createProfile(userId: string, email: string) {
  const { error } = await supabase.from("profiles").upsert(
    {
      id: userId,
      email,
      display_name: email.split("@")[0],
      has_seen_paywall: false,
      is_pro_version: false,
      is_trial_version: false,
    },
    { onConflict: "id" }
  );

  if (error) {
    console.warn("[ProfileService] createProfile failed:", error.message);
  }
}

/** Called after a real IAP purchase completes (production/TestFlight only) */
export async function updateProfileAfterPurchase(purchase: Purchase) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("profiles")
    .update({
      is_pro_version: true,
      is_trial_version: false,
      subscription_plan: purchase.productId,
      subscription_id: purchase.transactionId ?? null,
      purchase_time: purchase.transactionDate
        ? new Date(Number(purchase.transactionDate)).toISOString()
        : new Date().toISOString(),
      entitlement: "pro",
      has_seen_paywall: true,
    })
    .eq("id", user.id);

  if (error) {
    console.warn("[ProfileService] updateProfileAfterPurchase failed:", error.message);
  }
}

/** Called from subscription screen — works in dev and production */
export async function updateProfileSubscription(subscribed: boolean) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("profiles")
    .update(
      subscribed
        ? {
            is_pro_version: true,
            is_trial_version: false,
            entitlement: "pro",
            has_seen_paywall: true,
            subscription_plan: "ShopMyRoom.Monthly",
            subscription_id: `dev_sim_${Date.now()}`,
            purchase_time: new Date().toISOString(),
          }
        : {
            has_seen_paywall: true,
          }
    )
    .eq("id", user.id);

  if (error) {
    console.warn("[ProfileService] updateProfileSubscription failed:", error.message);
  }
}
