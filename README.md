# neckbeard.tech

Official website, project badges, and Cloudflare Agent-Ready discovery endpoints for **[NeckBeard](https://github.com/openasocket/NeckBeard)** (`https://neckbeard.tech`).

<p align="center">
  <a href="https://neckbeard.tech"><img src="assets/badge.svg" width="456" height="28" alt="NeckBeard Audited: Minimal Code · Boundary Safe · Right-Sized Scale"></a>
</p>

<p align="center">
  <a href="https://neckbeard.tech"><img src="assets/seal.png" width="380" alt="Built & Audited with NeckBeard — Principal-Engineer Verified"></a>
</p>

## Contents

- [`index.html`](index.html) & [`md/index.md`](md/index.md) — Self-contained interactive website and token-efficient Markdown mirror for `neckbeard.tech`
- [`worker.js`](worker.js) & [`wrangler.jsonc`](wrangler.jsonc) — Zero-dependency Cloudflare Worker + Static Assets deployment (`neckbeard.tech` & `www.neckbeard.tech`) providing `Accept: text/markdown` content negotiation, RFC 8288 discovery `Link` headers, canonical redirect, `/api/health`, and strict CSP/security headers
- [`.well-known/agent-skills/`](.well-known/agent-skills/index.json) — Agent Skills Discovery v0.2.0 catalog and SHA-256 verified `SKILL.md` definitions for all 5 official NeckBeard skills (`neckbeard`, `neckbeard-review`, `neckbeard-audit`, `neckbeard-debt`, `neckbeard-gain`)
- [`.well-known/api-catalog`](.well-known/api-catalog), [`openapi.json`](openapi.json), [`auth.md`](auth.md), [`index.json`](index.json) — RFC 9727 API catalog (`application/linkset+json`), OpenAPI 3.1.0 description, agent auth/access policy, and machine index
- [`agents.md`](agents.md), [`AGENTS.md`](AGENTS.md), [`INSTALL.md`](INSTALL.md), [`agents.txt`](agents.txt), [`llms.txt`](llms.txt), [`llms-full.txt`](llms-full.txt) — Normative agent manifest, portable drop-in ruleset, per-host installation guide, and LLM index
- [`robots.txt`](robots.txt) & [`sitemap.xml`](sitemap.xml) — Crawler directives with Cloudflare `Content-Signal: ai-train=yes, search=yes, ai-input=yes`
- [`assets/site.css`](assets/site.css) & [`assets/site.js`](assets/site.js) — Zero-dependency styling and interactive code-matrix / crumbling-code / review / guard / band engines
- [`assets/badge.svg`](assets/badge.svg) & [`assets/badge.png`](assets/badge.png) — Compact README value pill badge
- [`assets/seal.svg`](assets/seal.svg) & [`assets/seal.png`](assets/seal.png) — "Built & Audited with NeckBeard" Engineering Value Seal
- [`assets/social-card.png`](assets/social-card.png) — 1280×640 OpenGraph card

## Development & Cloudflare Deployment (Wrangler)

```bash
# Build dist/ and run the Cloudflare Agent-Ready & hostile-input test suite
npm test

# Preview locally with Cloudflare Wrangler
npm run dev

# Deploy to Cloudflare Workers + Static Assets (neckbeard.tech & www.neckbeard.tech)
npm run deploy
```

## License

[MIT](LICENSE).
