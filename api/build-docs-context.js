#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const DOCS_DIRS = [
  path.resolve(__dirname, '..', 'docs'),
  path.resolve(__dirname, '..', 'codelabs'),
  path.resolve(__dirname, '..', 'contributing'),
  path.resolve(__dirname, '..', 'blog'),
];

const MULTIPAZ_REPO_FILES = [
  'README.md',
  'CHANGELOG.md',
  'DEVELOPER-ENVIRONMENT.md',
  'TESTING.md',
  'CODING-STYLE.md',
  'CONTRIBUTING.md',
  'multipaz-cbor-rpc/RPC.md',
  'multipaz-cbor-rpc/README.md',
  'multipaz-server-deployment/README.md',
];

const MULTIPAZ_RAW_BASE =
  'https://raw.githubusercontent.com/openwallet-foundation/multipaz/main';

function collectMarkdownFiles(dir) {
  let files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(collectMarkdownFiles(fullPath));
    } else if (entry.name.endsWith('.md') || entry.name.endsWith('.mdx')) {
      files.push(fullPath);
    }
  }
  return files;
}

async function fetchMultipazRepoDocs() {
  let context = '';
  for (const filePath of MULTIPAZ_REPO_FILES) {
    const url = `${MULTIPAZ_RAW_BASE}/${filePath}`;
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.warn(`Warning: failed to fetch ${filePath} (${res.status})`);
        continue;
      }
      const content = await res.text();
      context += `\n--- multipaz-repo/${filePath} ---\n${content}\n`;
    } catch (err) {
      console.warn(`Warning: failed to fetch ${filePath}: ${err.message}`);
    }
  }
  return context;
}

async function buildContext() {
  const rootDir = path.resolve(__dirname, '..');
  let context = '';

  // Collect local docs
  for (const dir of DOCS_DIRS) {
    if (!fs.existsSync(dir)) continue;
    const files = collectMarkdownFiles(dir);
    for (const file of files) {
      const relativePath = path.relative(rootDir, file);
      const content = fs.readFileSync(file, 'utf-8');
      context += `\n--- ${relativePath} ---\n${content}\n`;
    }
  }

  // Fetch docs from multipaz repo
  console.log('Fetching docs from multipaz repo...');
  context += await fetchMultipazRepoDocs();

  const outputPath = path.join(__dirname, 'docs-context.txt');
  fs.writeFileSync(outputPath, context, 'utf-8');
  const wordCount = context.split(/\s+/).length;
  console.log(`Built docs context: ${wordCount} words -> ${outputPath}`);
}

buildContext();
