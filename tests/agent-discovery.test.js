/**
 * Agent Discovery, Cloudflare Agent-Ready Standards & Hostile-Input Verification Test
 * Mirrors zerosheet.ai's discovery.test.ts / markdown.test.ts and itsavibe.ai's agent-discovery.test.js.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import worker, {
  prefersMarkdown,
  markdownAssetFor,
  htmlPathFor,
  canonicalRedirect,
  handleHealth
} from '../worker.js';

let passed = 0;
async function test(name, fn) {
  await fn();
  passed++;
  console.log(`  PASS: ${name}`);
}

// Local mock of Cloudflare Workers Static Assets binding (env.ASSETS) backed by ./dist
const distRoot = path.resolve('dist');
const mockEnv = {
  APP_URL: 'https://neckbeard.tech',
  ASSETS: {
    async fetch(req) {
      const url = new URL(req.url);
      let rel = decodeURIComponent(url.pathname);
      if (rel === '/') rel = '/index.html';
      const resolved = path.resolve(distRoot, '.' + rel);
      // Reject path traversal outside distRoot
      if (!resolved.startsWith(distRoot + path.sep) && resolved !== distRoot) {
        return new Response('Not found', { status: 404 });
      }
      if (!fs.existsSync(resolved) || fs.statSync(resolved).isDirectory()) {
        return new Response('Not found', { status: 404 });
      }
      const ext = path.extname(resolved).toLowerCase();
      const ct =
        ext === '.html'
          ? 'text/html; charset=utf-8'
          : ext === '.md'
            ? 'text/markdown; charset=utf-8'
            : ext === '.json'
              ? 'application/json; charset=utf-8'
              : ext === '.svg'
                ? 'image/svg+xml'
                : ext === '.xml'
                  ? 'application/xml; charset=utf-8'
                  : 'text/plain; charset=utf-8';
      return new Response(fs.readFileSync(resolved), {
        status: 200,
        headers: { 'Content-Type': ct }
      });
    }
  }
};

console.log('\n1. Multi-size favicon.ico binary:');
await test('favicon.ico exists at root, assets/, and dist/ with valid 3-frame ICO header (16, 32, 48)', () => {
  const ico = fs.readFileSync('favicon.ico');
  assert.equal(ico.readUInt16LE(0), 0);
  assert.equal(ico.readUInt16LE(2), 1); // type 1 = ICO
  assert.equal(ico.readUInt16LE(4), 3); // 3 sizes (16x16, 32x32, 48x48)
  assert.equal(ico[6], 16);
  assert.equal(ico[6 + 16], 32);
  assert.equal(ico[6 + 32], 48);
  assert.deepEqual(ico, fs.readFileSync('assets/favicon.ico'));
  assert.deepEqual(ico, fs.readFileSync('dist/favicon.ico'));
});

console.log('\n2. RFC 9727 API Catalog, OpenAPI 3.1.0, auth.md, and /api/health:');
await test('/.well-known/api-catalog is valid RFC 9727 linkset+json', async () => {
  const res = await worker.fetch(new Request('https://neckbeard.tech/.well-known/api-catalog'), mockEnv);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type'), 'application/linkset+json');
  assert.equal(res.headers.get('access-control-allow-origin'), '*');
  const catalog = await res.json();
  assert(Array.isArray(catalog.linkset));
  const [api] = catalog.linkset;
  assert.equal(api.anchor, 'https://neckbeard.tech/api/');
  assert.equal(api['service-desc'][0].href, 'https://neckbeard.tech/openapi.json');
  assert.equal(api['service-doc'][0].href, 'https://neckbeard.tech/auth.md');
  assert.equal(api['service-doc'][1].href, 'https://neckbeard.tech/agents.md');
  assert.equal(api.status[0].href, 'https://neckbeard.tech/api/health');
});

await test('/openapi.json is valid OpenAPI 3.1.0', async () => {
  const res = await worker.fetch(new Request('https://neckbeard.tech/openapi.json'), mockEnv);
  assert.equal(res.status, 200);
  const spec = await res.json();
  assert.equal(spec.openapi, '3.1.0');
  assert(spec.paths['/api/health']);
  assert(spec.paths['/.well-known/agent-skills/index.json']);
  assert(spec.paths['/.well-known/api-catalog']);
});

await test('/auth.md documents public endpoints and zero-telemetry architecture', async () => {
  const res = await worker.fetch(new Request('https://neckbeard.tech/auth.md'), mockEnv);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /^text\/markdown/);
  const md = await res.text();
  assert(md.startsWith('# NeckBeard (neckbeard.tech) auth.md'));
  assert(md.includes('/.well-known/api-catalog'));
  assert(md.includes('/.well-known/agent-skills/index.json'));
});

await test('GET /api/health returns 200 ok:true and lists all 5 skills', async () => {
  const res = await worker.fetch(new Request('https://neckbeard.tech/api/health'), mockEnv);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('cache-control'), 'no-store');
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.equal(body.service, 'neckbeard.tech');
  assert.equal(body.skills.length, 5);
});

console.log('\n3. Agent Skills Discovery v0.2.0 (All 5 NeckBeard Skills):');
await test('/.well-known/agent-skills/index.json lists all 5 skills with exact SHA-256 digests', async () => {
  const res = await worker.fetch(new Request('https://neckbeard.tech/.well-known/agent-skills/index.json'), mockEnv);
  assert.equal(res.status, 200);
  const idx = await res.json();
  assert.equal(idx.$schema, 'https://schemas.agentskills.io/discovery/0.2.0/schema.json');
  assert.equal(idx.skills.length, 5);

  const expectedNames = ['neckbeard', 'neckbeard-review', 'neckbeard-audit', 'neckbeard-debt', 'neckbeard-gain'];
  assert.deepEqual(
    idx.skills.map(s => s.name),
    expectedNames
  );

  for (const skill of idx.skills) {
    assert.equal(skill.type, 'skill-md');
    assert.equal(skill.url, `https://neckbeard.tech/.well-known/agent-skills/${skill.name}/SKILL.md`);
    const skillRes = await worker.fetch(new Request(skill.url), mockEnv);
    assert.equal(skillRes.status, 200);
    assert.match(skillRes.headers.get('content-type'), /^text\/markdown/);
    const skillText = await skillRes.text();
    const expectedDigest = 'sha256:' + crypto.createHash('sha256').update(Buffer.from(skillText)).digest('hex');
    assert.equal(skill.digest, expectedDigest);
  }
});

console.log('\n4. Markdown Content Negotiation ("Markdown for Agents") & RFC 8288 Link Headers:');
await test('prefersMarkdown matches Accept: text/markdown and ignores browser/wildcard Accept', () => {
  assert.equal(prefersMarkdown(null), false);
  assert.equal(prefersMarkdown('text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'), false);
  assert.equal(prefersMarkdown('*/*'), false);
  assert.equal(prefersMarkdown('text/markdown'), true);
  assert.equal(prefersMarkdown('text/markdown, text/html;q=0.9'), true);
  assert.equal(prefersMarkdown('text/html, text/markdown;q=0.5'), false);
  assert.equal(prefersMarkdown('text/markdown;q=0'), false);
});

await test('GET / with Accept: text/markdown negotiates clean Markdown with canonical Link and X-Markdown-Tokens', async () => {
  const res = await worker.fetch(
    new Request('https://neckbeard.tech/', { headers: { Accept: 'text/markdown, text/html;q=0.8' } }),
    mockEnv
  );
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type'), 'text/markdown; charset=utf-8');
  assert.match(res.headers.get('vary') || '', /Accept/i);
  assert.equal(res.headers.get('link'), '<https://neckbeard.tech/>; rel="canonical"');
  assert(Number(res.headers.get('x-markdown-tokens')) > 100);
  const text = await res.text();
  assert(text.includes('# NeckBeard — Half the code. None of the blind spots. Built for everyday agent users.'));
});

await test('GET / with browser Accept returns HTML with RFC 8288 discovery Link headers and CSP', async () => {
  const res = await worker.fetch(
    new Request('https://neckbeard.tech/', { headers: { Accept: 'text/html,application/xhtml+xml' } }),
    mockEnv
  );
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type') || '', /text\/html/);
  const link = res.headers.get('link') || '';
  assert(link.includes('<https://neckbeard.tech/index.md>; rel="alternate"; type="text/markdown"'));
  assert(link.includes('<https://neckbeard.tech/.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"'));
  assert(link.includes('<https://neckbeard.tech/llms.txt>; rel="llms-txt"; type="text/markdown"'));
  assert(link.includes('<https://neckbeard.tech/.well-known/agent-skills/index.json>; rel="agent-skills"; type="application/json"'));
  assert(res.headers.get('content-security-policy')?.includes("default-src 'none'"));
  assert.equal(res.headers.get('x-frame-options'), 'DENY');
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
});

await test('llms.txt, llms-full.txt, agents.md, AGENTS.md, INSTALL.md, robots.txt (Content-Signal), and sitemap.xml exist and serve distinctly', async () => {
  const llms = fs.readFileSync('dist/llms.txt', 'utf8');
  assert(llms.includes('/.well-known/api-catalog'));
  assert(llms.includes('/.well-known/agent-skills/neckbeard/SKILL.md'));
  const robots = fs.readFileSync('dist/robots.txt', 'utf8');
  assert(robots.includes('Content-Signal: ai-train=yes, search=yes, ai-input=yes'));
  assert(robots.includes('Sitemap: https://neckbeard.tech/sitemap.xml'));
  const full = fs.readFileSync('dist/llms-full.txt', 'utf8');
  assert(full.includes('name: neckbeard-audit'));
  assert(full.includes('# NeckBeard (neckbeard.tech) auth.md'));
  assert(fs.existsSync('dist/sitemap.xml'));
  assert(fs.existsSync('dist/AGENTS.md'));
  assert(fs.existsSync('dist/INSTALL.md'));

  // Verify /agents.md returns the Agent Manifest while /AGENTS.md returns the drop-in ruleset
  const manifestRes = await worker.fetch(new Request('https://neckbeard.tech/agents.md'), mockEnv);
  assert.equal(manifestRes.status, 200);
  assert((await manifestRes.text()).startsWith('# NeckBeard — Agent Manifest (neckbeard.tech)'));

  const rulesetRes = await worker.fetch(new Request('https://neckbeard.tech/AGENTS.md'), mockEnv);
  assert.equal(rulesetRes.status, 200);
  assert((await rulesetRes.text()).startsWith('# Neckbeard\n\nYou are a principal engineer'));
});

console.log('\n5. Canonical Redirects & Hostile-Input Gate Checks:');
await test('www.neckbeard.tech and http://neckbeard.tech redirect 301 to https://neckbeard.tech', async () => {
  const r1 = await worker.fetch(new Request('https://www.neckbeard.tech/agents.md'), mockEnv);
  assert.equal(r1.status, 301);
  assert.equal(r1.headers.get('location'), 'https://neckbeard.tech/agents.md');

  const r2 = canonicalRedirect(new Request('http://neckbeard.tech/llms.txt'));
  assert.equal(r2.status, 301);
  assert.equal(r2.headers.get('location'), 'https://neckbeard.tech/llms.txt');
});

await test('Hostile inputs fail closed: POST /api/health -> 405, unknown/traversal .md -> 404, non-dist files unreachable', async () => {
  const postHealth = await worker.fetch(new Request('https://neckbeard.tech/api/health', { method: 'POST' }), mockEnv);
  assert.equal(postHealth.status, 405);
  const errBody = await postHealth.json();
  assert.equal(errBody.ok, false);
  assert.equal(errBody.code, 'method_not_allowed');

  const traversalMd = await worker.fetch(
    new Request('https://neckbeard.tech/..%2fpackage.json.md', { headers: { Accept: 'text/markdown' } }),
    mockEnv
  );
  assert.equal(traversalMd.status, 404);

  const secretProbe = await worker.fetch(new Request('https://neckbeard.tech/.neckbeard.json'), mockEnv);
  assert.equal(secretProbe.status, 404);

  const coffeeRes = await worker.fetch(new Request('https://neckbeard.tech/api/coffee'), mockEnv);
  assert.equal(coffeeRes.status, 418);
  assert.equal(coffeeRes.headers.get('x-powered-by'), 'ThinkPad-X220-TrackPoint');
});

await test('RANTS_BY_TOPIC in assets/site.js contains 16 topics with 20 unique quips each (320 total)', () => {
  const siteJs = fs.readFileSync('dist/assets/site.js', 'utf8');
  const m = siteJs.match(/const RANTS_BY_TOPIC = (\{[\s\S]*?\n\});/);
  assert(m, 'RANTS_BY_TOPIC object found in assets/site.js');
  const byTopic = JSON.parse(m[1]);
  const topics = Object.keys(byTopic);
  assert.equal(topics.length, 16);
  for (const t of topics) {
    assert.equal(byTopic[t].length, 20, `Topic ${t} should have 20 quips`);
  }
  const all = Object.values(byTopic).flat();
  assert.equal(new Set(all).size, 320);
});

console.log(`\n${passed} passed, 0 failed\n`);
