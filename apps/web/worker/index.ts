interface Env {
  ASSETS: Fetcher;
  API: Fetcher;
}

interface ProductMeta {
  name: string;
  shortDescription: string;
  imageUrl: string | null;
}

/**
 * Edge entry for the storefront.
 *  /api/*  → API Worker via service binding (same origin, no CORS)
 *  /p/:slug → SPA shell with product-specific Open Graph tags (WhatsApp/Facebook previews)
 *  else    → static assets (SPA fallback handled by assets config)
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/')) {
      return env.API.fetch(request);
    }

    const shell = await env.ASSETS.fetch(new Request(new URL('/', url), request));
    const match = url.pathname.match(/^\/p\/([a-z0-9-]+)\/?$/);
    if (!match) return shell;

    try {
      const res = await env.API.fetch(new Request(new URL(`/api/products/${match[1]}`, url)));
      if (!res.ok) return shell;
      const p = (await res.json()) as ProductMeta;
      const image = p.imageUrl ? new URL(p.imageUrl, url).toString() : '';
      const set = (attr: string) => ({
        element(el: Element) {
          el.setAttribute('content', attr);
        },
      });
      return new HTMLRewriter()
        .on('title', {
          element(el) {
            el.setInnerContent(`${p.name} — Preppal`);
          },
        })
        .on('meta[property="og:title"]', set(`${p.name} — Preppal`))
        .on('meta[property="og:description"]', set(p.shortDescription))
        .on('meta[property="og:image"]', set(image))
        .transform(shell);
    } catch {
      return shell;
    }
  },
} satisfies ExportedHandler<Env>;
