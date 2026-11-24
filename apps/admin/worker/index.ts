interface Env {
  ASSETS: Fetcher;
  API: Fetcher;
}

/**
 * Admin edge entry. Cloudflare Access sits in front of this hostname and adds
 * `Cf-Access-Jwt-Assertion` to every request; we forward it untouched to the API,
 * which verifies it. Only /api/admin/* and read-only public endpoints are reachable.
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) return env.API.fetch(request);
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
