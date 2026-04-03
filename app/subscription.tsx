import PaywallScreen from "@/components/paywall/PaywallScreen";
import { updateProfileSubscription } from "@/services/ProfileService";
import { useRouter } from "expo-router";

export default function Subscription() {
  const router = useRouter();

  const handleSuccess = async () => {
    await updateProfileSubscription(true);
    router.replace("/(home)/home");
  };

  const handleDismiss = async () => {
    await updateProfileSubscription(false);
    router.replace("/(home)/home");
  };

  return (
    <PaywallScreen
      onSuccess={handleSuccess}
      onDismiss={handleDismiss}
    />
  );
}
