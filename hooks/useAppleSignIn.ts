import { supabase } from "@/lib/supabase";
import * as AppleAuthentication from "expo-apple-authentication";
import { useEffect, useState } from "react";

export default function useAppleSignIn() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    AppleAuthentication.isAvailableAsync().then(setIsAvailable);
  }, []);

  const signInWithApple = async (): Promise<boolean> => {
    setError(null);
    setLoading(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        throw new Error("Apple Sign In did not return an identity token.");
      }

      // DEBUG: decode token payload to verify audience
      const payload = JSON.parse(atob(credential.identityToken.split(".")[1]));
      console.log("[AppleSignIn] token aud:", payload.aud);

      const { error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: credential.identityToken,
      });

      if (error) throw error;
      return true;
    } catch (err: any) {
      if (err?.code !== "ERR_CANCELED") {
        setError(err?.message ?? "Apple Sign In failed.");
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { signInWithApple, isAvailable, loading, error };
}
