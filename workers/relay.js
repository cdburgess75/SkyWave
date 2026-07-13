/**
 * SKYWAVE relay — Cloudflare Worker
 *
 * A tiny personal CORS relay so the app no longer depends on flaky public
 * proxies. Fetches only from an allow-listed set of hosts (EiBi + NetLogger)
 * and returns the body with permissive CORS headers.
 *
 * Deploy (free tier, ~5 minutes):
 *   1. https://dash.cloudflare.com → Workers & Pages → Create → Worker
 *   2. Name it (e.g. "skywave-relay") → Deploy → Edit code
 *   3. Replace the template with this file → Deploy
 *   4. Copy the worker URL (https://skywave-relay.<you>.workers.dev)
 *   5. In SKYWAVE: Ref tab → "Manual load" details → paste into
 *      "Custom relay URL" → Save. The app tries your relay first,
 *      public relays remain as fallback.
 */

const ALLOW = new Set([
  "www.eibispace.de", "eibispace.de",
  "www.netlogger.org", "netlogger.org",
  "www.netlogger1.org", "netlogger1.org",
  "www.netlogger2.org", "netlogger2.org",
  "www.netlogger3.org", "netlogger3.org",
]);

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const target = url.searchParams.get("url");
    if (!target) return resp("usage: ?url=<encoded target url>", 400);

    let t;
    try { t = new URL(target); } catch { return resp("bad target url", 400); }
    if (!ALLOW.has(t.hostname)) return resp("host not allowed", 403);
    if (t.protocol !== "http:" && t.protocol !== "https:") return resp("bad protocol", 400);

    try {
      const upstream = await fetch(t.toString(), {
        headers: { "User-Agent": "SkyWave-relay/1.0 (+https://github.com/cdburgess75/SkyWave)" },
        signal: AbortSignal.timeout(9000),
      });
      const body = await upstream.arrayBuffer();
      return new Response(body, {
        status: upstream.status,
        headers: {
          "Content-Type": upstream.headers.get("Content-Type") || "text/plain; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=30",
        },
      });
    } catch (e) {
      return resp("upstream fetch failed: " + (e && e.message), 502);
    }
  },
};

function resp(msg, status) {
  return new Response(msg, {
    status,
    headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "text/plain" },
  });
}
