#!/bin/bash
# Build script for neckbeard.tech (Cloudflare Workers Static Assets)
set -e

rm -rf dist
mkdir -p dist

# Recompute SHA-256 digests in .well-known/agent-skills/index.json so it always matches SKILL.md bytes
node -e '
const fs = require("fs");
const crypto = require("crypto");
const idx = JSON.parse(fs.readFileSync(".well-known/agent-skills/index.json", "utf8"));
for (const s of idx.skills) {
  const bytes = fs.readFileSync(`.well-known/agent-skills/${s.name}/SKILL.md`);
  s.digest = "sha256:" + crypto.createHash("sha256").update(bytes).digest("hex");
}
fs.writeFileSync(".well-known/agent-skills/index.json", JSON.stringify(idx, null, 2) + "\n");
'

# Copy root HTML & favicon
cp index.html favicon.ico CNAME dist/

# Copy static assets & Markdown mirrors (including md/agents.md and md/index.md)
cp -r assets md .well-known dist/

# Copy Cloudflare headers/redirects and crawl discovery files
cp _headers _redirects robots.txt sitemap.xml dist/

# Generate llms-full.txt dynamically from the canonical agent docs & 5 SKILL.md files
cat \
  md/agents.md \
  <(printf "\n\n---\n\n") \
  AGENTS.md \
  <(printf "\n\n---\n\n") \
  .well-known/agent-skills/neckbeard/SKILL.md \
  <(printf "\n\n---\n\n") \
  .well-known/agent-skills/neckbeard-review/SKILL.md \
  <(printf "\n\n---\n\n") \
  .well-known/agent-skills/neckbeard-audit/SKILL.md \
  <(printf "\n\n---\n\n") \
  .well-known/agent-skills/neckbeard-debt/SKILL.md \
  <(printf "\n\n---\n\n") \
  .well-known/agent-skills/neckbeard-gain/SKILL.md \
  <(printf "\n\n---\n\n") \
  INSTALL.md \
  <(printf "\n\n---\n\n") \
  auth.md \
  > llms-full.txt

# Copy standalone normative agent manifests & discovery documents
cp AGENTS.md INSTALL.md auth.md agents.txt llms.txt llms-full.txt openapi.json index.json dist/

echo "Built neckbeard.tech -> dist/"
