#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

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

// Site sections served under a plugin route, mapped to their URL base. The
// URLs emitted below are what the Ask AI model links to, so they must match
// the site's Docusaurus routes.
const DOCS_DIRS = [
  { dir: path.resolve(__dirname, '..', 'docs'), urlBase: '/docs' },
  { dir: path.resolve(__dirname, '..', 'codelabs'), urlBase: '/codelabs' },
  { dir: path.resolve(__dirname, '..', 'contributing'), urlBase: '/contributing' },
  { dir: path.resolve(__dirname, '..', 'blog'), urlBase: null }, // blog URLs derive from post dates, not file paths
];

// Converts a markdown file path relative to its content dir to the URL path of
// its rendered page, e.g. with urlBase "/docs":
//   getting-started/verifier/03-issuer-trust.md
//     -> /docs/getting-started/verifier/issuer-trust
// Numeric ordering prefixes are stripped from every segment and "index" files
// map to their folder root, matching Docusaurus default slugging.
function siteUrlPath(urlBase, inDirPath) {
  const dir = path.dirname(inDirPath);
  const base = path.basename(inDirPath).replace(/\.(md|mdx)$/, '');
  const segments = [...dir.split(path.sep), ...(base !== 'index' ? [base] : [])]
    .filter((s) => s && s !== '.')
    .map((s) => s.replace(/^\d{1,3}-/, ''));
  return urlBase + (segments.length ? `/${segments.join('/')}` : '');
}

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
      // GitHub URL so the AI can cite these repo files
      const githubUrl = `https://github.com/openwallet-foundation/multipaz/blob/main/${filePath}`;
      context += `\n--- multipaz-repo/${filePath} ---\nGitHub source: ${githubUrl}\n${content}\n`;
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
  for (const { dir, urlBase } of DOCS_DIRS) {
    if (!fs.existsSync(dir)) continue;
    const files = collectMarkdownFiles(dir);
    for (const file of files) {
      const relativePath = path.relative(rootDir, file);
      // Strip ordering prefixes from filenames (e.g. "01-storage.md" -> "storage.md")
      // so the AI references actual Docusaurus URL slugs. Only targets short
      // numeric prefixes (1-3 digits) on the basename to avoid mangling dates.
      const dirName = path.dirname(relativePath);
      const base = path.basename(relativePath).replace(/^\d{1,3}-/, '');
      const slugPath = path.join(dirName, base);
      const content = fs.readFileSync(file, 'utf-8');
      // "Site page:" gives the model the exact URL to link to. Blog pages are
      // skipped because their URLs derive from post dates, not file paths.
      const inDirPath = path.relative(dir, file);
      const sitePage = urlBase ? `Site page: ${siteUrlPath(urlBase, inDirPath)}\n` : '';
      context += `\n--- ${slugPath} ---\n${sitePage}${content}\n`;
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
