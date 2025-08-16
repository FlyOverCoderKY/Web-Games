/**
 * Minimal, privacy-friendly telemetry. Page views only. Disabled by default.
 * Opt-in via localStorage key 'analytics_opt_in' = 'true' or env VITE_TELEMETRY = '1'.
 * No network calls by default; replace sendPageView with real endpoint if desired.
 */

const OPT_IN_KEY = "analytics_opt_in";

function isOptedIn(): boolean {
  try {
    if (
      import.meta.env &&
      (import.meta as unknown as { env?: { VITE_TELEMETRY?: string } }).env
        ?.VITE_TELEMETRY === "1"
    )
      return true;
    const v = localStorage.getItem(OPT_IN_KEY);
    return v === "true";
  } catch {
    return false;
  }
}

export function setAnalyticsOptIn(enabled: boolean): void {
  try {
    localStorage.setItem(OPT_IN_KEY, enabled ? "true" : "false");
  } catch {
    // ignore
  }
}

function sendPageView(path: string): void {
  // Replace with real endpoint if needed. Remains local/log-only by default.
  console.log("[telemetry] page_view", { path, ts: Date.now() });
}

export function trackPageView(path: string): void {
  if (!isOptedIn()) return;
  sendPageView(path);
}
