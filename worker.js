/**
 * worker.js — Cloudflare Worker & Agent-Ready Discovery Layer for neckbeard.tech
 *
 * Implements Cloudflare's agentified website standards (matching zerosheet.ai & itsavibe.ai):
 * 1. Canonical redirect: http:// and www.neckbeard.tech -> https://neckbeard.tech (301).
 * 2. Liveness API: GET/HEAD /api/health returns 200 JSON (fail-closed 405 on other methods).
 * 3. Markdown content negotiation ("Markdown for Agents"): when an agent sends
 *    `Accept: text/markdown` on `/` or `/index.html` (or requests `/index.md` or `/md/index.md`),
 *    serves `/md/index.md` with `Content-Type: text/markdown; charset=utf-8`, `Vary: Accept`,
 *    `X-Markdown-Tokens`, and `Link: <https://neckbeard.tech/>; rel="canonical"`.
 * 4. Case-safe normative Markdown routing across macOS/Cloudflare:
 *    - `/agents.md` serves `/md/agents.md` (the NeckBeard Agent Manifest)
 *    - `/AGENTS.md` serves `/AGENTS.md` (the drop-in portable ruleset, byte-identical to neckbeard/SKILL.md body)
 *    - `/INSTALL.md` and `/install.md` serve `/INSTALL.md`
 * 5. RFC 8288 Discovery Link headers: on HTML responses, sets `Vary: Accept` and `Link`
 *    headers pointing to `index.md`, `/.well-known/api-catalog`, `/llms.txt`, and
 *    `/.well-known/agent-skills/index.json`.
 * 6. Security headers: CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy,
 *    Permissions-Policy, and explicit UTF-8 Content-Types + CORS on discovery endpoints.
 */

const CSP = [
  "default-src 'none'",
  "script-src 'self' 'wasm-unsafe-eval' https://static.cloudflareinsights.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://raw.githubusercontent.com https://api.github.com https://static.cloudflareinsights.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'"
].join('; ');

const SKILLS = [
  'neckbeard',
  'neckbeard-review',
  'neckbeard-audit',
  'neckbeard-debt',
  'neckbeard-gain'
];

const FALLBACK_VERSION = '0.3.5';
const SEMVER_RE = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
let cachedRelease = {
  version: FALLBACK_VERSION,
  tag: `v${FALLBACK_VERSION}`,
  releaseUrl: `https://github.com/openasocket/NeckBeard/releases/tag/v${FALLBACK_VERSION}`,
  expiresAt: 0
};

export function compareSemver(a, b) {
  const pa = String(a).replace(/^v/i, '').split(/[.-]/).map((x) => (Number.isNaN(Number(x)) ? x : Number(x)));
  const pb = String(b).replace(/^v/i, '').split(/[.-]/).map((x) => (Number.isNaN(Number(x)) ? x : Number(x)));
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const va = pa[i] ?? 0;
    const vb = pb[i] ?? 0;
    if (va === vb) continue;
    return va > vb ? 1 : -1;
  }
  return 0;
}

async function resolveLatestRelease() {
  const now = Date.now();
  if (now < cachedRelease.expiresAt) return cachedRelease;

  const edgeCache = typeof caches !== 'undefined' && caches.default ? caches.default : null;
  const cacheKey = new Request('https://neckbeard.tech/__internal/latest-release-v2');
  if (edgeCache) {
    try {
      const hit = await edgeCache.match(cacheKey);
      if (hit) {
        const data = await hit.json();
        if (data && SEMVER_RE.test(data.version) && compareSemver(data.version, FALLBACK_VERSION) >= 0) {
          cachedRelease = { ...data, expiresAt: now + 60_000 };
          return cachedRelease;
        }
      }
    } catch {}
  } else {
    cachedRelease.expiresAt = now + 60_000;
    return cachedRelease;
  }

  let bestVer = FALLBACK_VERSION;
  let fetchedAny = false;
  const headers = {
    'User-Agent': 'neckbeard.tech-cloudflare-worker'
  };

  try {
    // Query 3 independent sources in parallel:
    // 1) GitHub web /releases/latest 302 Location header (no 60 req/hr api.github.com IP rate limit)
    // 2) raw.githubusercontent.com/openasocket/NeckBeard/main/package.json (no 60 req/hr API rate limit)
    // 3) api.github.com/repos/openasocket/NeckBeard/releases/latest
    const [webRel, rawPkg, apiRel] = await Promise.allSettled([
      fetch('https://github.com/openasocket/NeckBeard/releases/latest', { headers, redirect: 'manual' }),
      fetch('https://raw.githubusercontent.com/openasocket/NeckBeard/main/package.json', { headers }),
      fetch('https://api.github.com/repos/openasocket/NeckBeard/releases/latest', {
        headers: { ...headers, 'Accept': 'application/vnd.github+json' }
      })
    ]);

    if (webRel.status === 'fulfilled') {
      const loc = webRel.value.headers.get('location') || '';
      const m = loc.match(/\/releases\/tag\/v?(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)/i);
      if (m && SEMVER_RE.test(m[1])) {
        fetchedAny = true;
        if (compareSemver(m[1], bestVer) > 0) bestVer = m[1];
      }
    }

    if (rawPkg.status === 'fulfilled' && rawPkg.value.ok) {
      const pkgJson = await rawPkg.value.json();
      const candidate = String(pkgJson?.version || '').replace(/^v/i, '');
      if (SEMVER_RE.test(candidate)) {
        fetchedAny = true;
        if (compareSemver(candidate, bestVer) > 0) bestVer = candidate;
      }
    }

    if (apiRel.status === 'fulfilled' && apiRel.value.ok) {
      const relJson = await apiRel.value.json();
      const candidate = String(relJson?.tag_name || '').replace(/^v/i, '');
      if (SEMVER_RE.test(candidate)) {
        fetchedAny = true;
        if (compareSemver(candidate, bestVer) > 0) bestVer = candidate;
      }
    }
  } catch {}

  const resolved = {
    version: bestVer,
    tag: `v${bestVer}`,
    releaseUrl: `https://github.com/openasocket/NeckBeard/releases/tag/v${bestVer}`,
    expiresAt: now + 60_000
  };
  cachedRelease = resolved;

  if (edgeCache && fetchedAny) {
    try {
      await edgeCache.put(
        cacheKey,
        new Response(JSON.stringify(resolved), {
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' }
        })
      );
    } catch {}
  }
  return resolved;
}

export function applyDynamicVersion(text, rel) {
  if (!rel || !SEMVER_RE.test(rel.version)) return text;
  return text
    .replace(/(<[^>]*\bdata-nb-version\b[^>]*>)\s*v?\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?\s*(<\/)/g, `$1${rel.tag}$2`)
    .replace(/releases\/tag\/v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?/g, `releases/tag/${rel.tag}`)
    .replace(/Release v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?/g, `Release ${rel.tag}`)
    .replace(/NeckBeard v\d+(?:\.\d+){1,2}/g, `NeckBeard ${rel.tag}`)
    .replace(/"version":\s*"\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?"/g, `"version": "${rel.version}"`);
}

// Standalone normative .md files at root that must be served directly (not rewritten to /md/index.md)
const ROOT_NORMATIVE_MD = new Set([
  '/agents.md',
  '/AGENTS.md',
  '/INSTALL.md',
  '/install.md',
  '/auth.md'
]);

function quality(accept, type) {
  let best = 0;
  for (const part of accept.split(',')) {
    const segments = part.trim().toLowerCase().split(';').map(s => s.trim());
    if (segments[0] !== type) continue;
    const qParam = segments.slice(1).find(p => p.startsWith('q='));
    const v = qParam ? Number(qParam.slice(2)) : 1;
    if (Number.isFinite(v)) {
      best = Math.max(best, Math.min(1, Math.max(0, v)));
    }
  }
  return best;
}

export function prefersMarkdown(accept) {
  if (!accept) return false;
  const md = quality(accept, 'text/markdown');
  return md > 0 && md >= quality(accept, 'text/html');
}

export function markdownAssetFor(pathname) {
  if (ROOT_NORMATIVE_MD.has(pathname)) return null;
  if (pathname === '/' || pathname === '/index.html' || pathname === '/index.md' || pathname === '/md/index.md') {
    return '/md/index.md';
  }
  return null;
}

export function htmlPathFor(pathname) {
  if (pathname === '/' || pathname === '/index.md' || pathname === '/index.html' || pathname === '/md/index.md') {
    return '/';
  }
  return pathname.replace(/\.md$/, '.html');
}

export function canonicalRedirect(request, appUrl = 'https://neckbeard.tech') {
  const url = new URL(request.url);
  const app = new URL(appUrl);
  const isWww = url.hostname === `www.${app.hostname}`;
  if (url.hostname !== app.hostname && !isWww) return null;
  if (url.protocol === 'https:' && !isWww) return null;
  return Response.redirect(`${app.origin}${url.pathname}${url.search}`, 301);
}

export function withSecurityHeaders(res, requestUrl = 'https://neckbeard.tech/') {
  const out = new Response(res.body, res);
  const h = out.headers;
  const url = new URL(requestUrl);
  h.set('X-Content-Type-Options', 'nosniff');
  h.set('X-Frame-Options', 'DENY');
  h.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  h.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  h.set('X-Powered-By', 'ThinkPad-X220-TrackPoint');
  h.set('X-Neckbeard-Verdict', 'Half the code. Zero blind spots.');
  if (url.protocol === 'https:') {
    h.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  if ((h.get('content-type') || '').includes('text/html') && !h.has('Content-Security-Policy')) {
    h.set('Content-Security-Policy', CSP);
  }
  return out;
}

export function handleHealth(request, rel = cachedRelease) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Max-Age': '86400'
      }
    });
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response(JSON.stringify({ ok: false, error: 'Method not allowed', code: 'method_not_allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Allow': 'GET, HEAD, OPTIONS',
        'Cache-Control': 'no-store'
      }
    });
  }
  const activeRel = rel && SEMVER_RE.test(rel.version) ? rel : cachedRelease;
  const body = JSON.stringify({
    ok: true,
    service: 'neckbeard.tech',
    project: 'NeckBeard',
    version: activeRel.version,
    tag: activeRel.tag,
    releaseUrl: activeRel.releaseUrl,
    skills: SKILLS
  });
  return new Response(request.method === 'HEAD' ? null : body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store'
    }
  });
}

function discoveryHeadersFor(pathname) {
  if (pathname === '/.well-known/api-catalog') {
    return { 'Content-Type': 'application/linkset+json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=300' };
  }
  if (pathname === '/.well-known/agent-skills/index.json' || pathname === '/openapi.json' || pathname === '/index.json') {
    return { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=300' };
  }
  if (
    pathname === '/llms.txt' ||
    pathname === '/llms-full.txt' ||
    pathname === '/md/agents.md' ||
    ROOT_NORMATIVE_MD.has(pathname) ||
    /^\/\.well-known\/agent-skills\/[a-z0-9-]+\/SKILL\.md$/.test(pathname)
  ) {
    return { 'Content-Type': 'text/markdown; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=300' };
  }
  if (pathname === '/agents.txt' || pathname === '/robots.txt') {
    return { 'Content-Type': 'text/plain; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=300' };
  }
  if (pathname === '/sitemap.xml') {
    return { 'Content-Type': 'application/xml; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=300' };
  }
  if (pathname === '/assets/site.css' || pathname === '/assets/site.js') {
    return { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=0, must-revalidate' };
  }
  if (pathname.startsWith('/assets/')) {
    return { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=3600' };
  }
  return null;
}

function resolveAssetPath(pathname) {
  if (pathname === '/.well-known/agents.json') return '/index.json';
  if (pathname === '/agents.md') return '/md/agents.md';
  if (pathname === '/install.md') return '/INSTALL.md';
  return pathname;
}

export default {
  async fetch(request, env) {
    const appUrl = (env && env.APP_URL) || 'https://neckbeard.tech';
    const redirect = canonicalRedirect(request, appUrl);
    if (redirect) return withSecurityHeaders(redirect, request.url);

    const url = new URL(request.url);
    const { pathname } = url;

    if (pathname === '/api/health' || pathname === '/api/version') {
      const rel = await resolveLatestRelease();
      return withSecurityHeaders(handleHealth(request, rel), request.url);
    }

    // RFC 2324 / HTCPCP Easter egg endpoint for curious engineers & agents
    if (pathname === '/api/coffee' || pathname === '/coffee' || pathname === '/418') {
      const body = JSON.stringify({
        ok: false,
        status: 418,
        error: "I'm a ThinkPad X220 in a colocation closet, not an espresso machine.",
        rfc: 'RFC 2324 (HTCPCP/1.0)',
        prescription: 'Delete 200 lines of AI boilerplate, add AND owner_id = $2, and drink cold brew.'
      });
      return withSecurityHeaders(
        new Response(request.method === 'HEAD' ? null : body, {
          status: 418,
          statusText: "I'm a teapot",
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-store'
          }
        }),
        request.url
      );
    }

    if (pathname === '/agents') {
      return withSecurityHeaders(Response.redirect(new URL('/agents.md', url).href, 301), request.url);
    }
    if (pathname === '/agents.json') {
      return withSecurityHeaders(Response.redirect(new URL('/index.json', url).href, 301), request.url);
    }

    if (request.method === 'GET' || request.method === 'HEAD') {
      const isExplicitMd =
        (pathname === '/index.md' || pathname === '/md/index.md') ||
        (pathname.endsWith('.md') &&
          !ROOT_NORMATIVE_MD.has(pathname) &&
          pathname !== '/md/agents.md' &&
          !pathname.startsWith('/.well-known/'));
      const wantsMd = isExplicitMd || prefersMarkdown(request.headers.get('accept'));
      const mdAsset = markdownAssetFor(pathname);

      if (wantsMd && mdAsset && env && env.ASSETS) {
        const assetReq = new Request(new URL(mdAsset, url), {
          method: 'GET',
          headers: request.headers
        });
        const assetRes = await env.ASSETS.fetch(assetReq);
        if (assetRes.ok) {
          const rel = await resolveLatestRelease();
          const text = applyDynamicVersion(await assetRes.text(), rel);
          const approxTokens = Math.max(1, Math.ceil(text.length / 4));
          const headers = new Headers(assetRes.headers);
          headers.set('Content-Type', 'text/markdown; charset=utf-8');
          headers.set('Access-Control-Allow-Origin', '*');
          headers.set('Vary', 'Accept');
          headers.set('X-Markdown-Tokens', String(approxTokens));
          const canonicalUrl = new URL(htmlPathFor(pathname), url).href;
          headers.set('Link', `<${canonicalUrl}>; rel="canonical"`);
          if (isExplicitMd) {
            headers.set('X-Robots-Tag', 'noindex');
          }
          return withSecurityHeaders(
            new Response(request.method === 'HEAD' ? null : text, { status: 200, headers }),
            request.url
          );
        }
      }
      if (isExplicitMd && !mdAsset) {
        return withSecurityHeaders(
          new Response('Not found\n', {
            status: 404,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          }),
          request.url
        );
      }
    }

    if (!env || !env.ASSETS) {
      return withSecurityHeaders(
        new Response('Not found\n', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }),
        request.url
      );
    }

    const fetchPathname = resolveAssetPath(pathname);
    const assetReq =
      fetchPathname === pathname
        ? request
        : new Request(new URL(fetchPathname, url), { method: request.method, headers: request.headers });
    const res = await env.ASSETS.fetch(assetReq);
    let out = new Response(res.body, res);

    const contentType = out.headers.get('content-type') || '';
    if (
      out.ok &&
      request.method === 'GET' &&
      (contentType.includes('text/html') || fetchPathname === '/index.json' || fetchPathname === '/openapi.json')
    ) {
      const rel = await resolveLatestRelease();
      const rewritten = applyDynamicVersion(await out.text(), rel);
      out = new Response(rewritten, out);
    }

    const extraHeaders = discoveryHeadersFor(fetchPathname);
    if (extraHeaders && (out.ok || out.status === 304)) {
      for (const [k, v] of Object.entries(extraHeaders)) {
        out.headers.set(k, v);
      }
    }

    const mdAsset = markdownAssetFor(pathname);
    if (mdAsset && contentType.includes('text/html')) {
      out.headers.set('Vary', 'Accept');
      out.headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
      const mdHref = new URL('/index.md', url).href;
      const catalogHref = new URL('/.well-known/api-catalog', url).href;
      const llmsHref = new URL('/llms.txt', url).href;
      const skillsHref = new URL('/.well-known/agent-skills/index.json', url).href;
      out.headers.set(
        'Link',
        [
          `<${mdHref}>; rel="alternate"; type="text/markdown"`,
          `<${catalogHref}>; rel="api-catalog"; type="application/linkset+json"`,
          `<${llmsHref}>; rel="llms-txt"; type="text/markdown"`,
          `<${skillsHref}>; rel="agent-skills"; type="application/json"`
        ].join(', ')
      );
    }

    return withSecurityHeaders(out, request.url);
  }
};
