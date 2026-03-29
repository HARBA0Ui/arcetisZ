import { GoogleSessionProvider } from "@/components/auth/google-session-provider";
import { GoogleSyncPanel } from "@/components/auth/google-sync-panel";

export default function GoogleFrontofficeSyncPage() {
  return (
    <GoogleSessionProvider>
      <GoogleSyncPanel />
    </GoogleSessionProvider>
  );
}
