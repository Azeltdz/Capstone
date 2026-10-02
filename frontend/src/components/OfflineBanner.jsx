import { useOnlineStatus } from "../hooks/useOnlineStatus";

export default function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <div className="alert-banner" role="status">
      You're offline. Orders and changes can't be saved until the connection is back.
    </div>
  );
}