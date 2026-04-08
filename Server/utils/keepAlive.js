// Pings the server itself every 14 minutes to prevent Render spin-down.
// Runs only in production.

const PING_INTERVAL = 14 * 60 * 1000; // 14 min (Render spins down at 15)

export const startKeepAlive = () => {
  if (process.env.NODE_ENV !== "production") return;

  const url = process.env.BACKEND_URL;
  if (!url) {
    console.warn("[KeepAlive] BACKEND_URL not set - skipping self-ping");
    return;
  }

  setInterval(async () => {
    try {
      const response = await fetch(`${url}/health`);
      const data = await response.json();
      console.log(`[KeepAlive] Ping OK at ${data.timestamp}`);
    } catch (err) {
      console.error("[KeepAlive] Ping failed:", err.message);
    }
  }, PING_INTERVAL);

  console.log("[KeepAlive] Self-ping started - every 14 minutes");
};
