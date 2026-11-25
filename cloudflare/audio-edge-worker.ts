/**
 * Cloudflare Workers Edge Audio Caching Proxy (Free Tier: 100k req/day)
 * Caches immutable Gemini 3.8 Neural WAV & ElevenLabs MP3 audio assets globally at Cloudflare PoPs.
 */
export interface Env {
  ORIGIN_URL: string;
}

interface WorkerExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
}

interface WorkerCacheStorage {
  default: {
    match(request: Request): Promise<Response | undefined>;
    put(request: Request, response: Response): Promise<void>;
  };
}

export default {
  async fetch(request: Request, env: Env, ctx: WorkerExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const originUrl = new URL(url.pathname + url.search, env.ORIGIN_URL);

    // Edge-cache POST /api/audio/tts & /api/audio/podcast by SHA-256 request body hash
    if (request.method === "POST" && (url.pathname === "/api/audio/tts" || url.pathname === "/api/audio/podcast")) {
      const bodyText = await request.clone().text();
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(bodyText));
      const hashHex = Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const cache = (caches as unknown as WorkerCacheStorage).default;
      const cacheKey = new Request(`${url.origin}${url.pathname}?edge_hash=${hashHex}`, { method: "GET" });
      const cached = await cache.match(cacheKey);
      if (cached) {
        const hit = new Response(cached.body, cached);
        hit.headers.set("X-Cloudflare-Edge-Cache", "HIT");
        return hit;
      }

      const upstream = await fetch(originUrl.toString(), {
        method: "POST",
        headers: request.headers,
        body: bodyText,
      });

      if (upstream.ok) {
        const responseToCache = new Response(upstream.clone().body, upstream);
        responseToCache.headers.set("Cache-Control", "public, max-age=31536000, immutable");
        ctx.waitUntil(cache.put(cacheKey, responseToCache));
      }

      const miss = new Response(upstream.body, upstream);
      miss.headers.set("X-Cloudflare-Edge-Cache", "MISS");
      return miss;
    }

    return fetch(originUrl.toString(), request);
  },
};
