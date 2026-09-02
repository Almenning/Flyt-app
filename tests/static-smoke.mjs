import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_EXTENSIONS = new Set(['.css', '.html', '.js', '.json', '.md', '.mjs', '.webmanifest', '.yaml', '.yml']);
const failures = [];
const warnings = [];
let passed = 0;

function rel(file) {
  return path.relative(ROOT, file).split(path.sep).join('/');
}

function read(file) {
  return readFileSync(file, 'utf8');
}

function walk(dir = ROOT) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(target));
    else files.push(target);
  }
  return files;
}

function check(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`ok - ${name}`);
  } catch (error) {
    failures.push(`${name}: ${error.message}`);
    console.error(`not ok - ${name}\n  ${error.message}`);
  }
}

function attr(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'));
  return match?.[2] ?? null;
}

function withoutQuery(ref) {
  return ref.split(/[?#]/, 1)[0];
}

function isExternal(ref) {
  return /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(ref);
}

function resolveLocal(fromFile, rawRef) {
  assert.ok(rawRef, `${rel(fromFile)} contains an empty resource reference`);
  assert.ok(!rawRef.startsWith('/'), `${rel(fromFile)} uses root-relative ${rawRef}; this breaks on the GitHub Pages project path`);
  const clean = decodeURIComponent(withoutQuery(rawRef));
  const target = path.resolve(path.dirname(fromFile), clean);
  assert.ok(target === ROOT || target.startsWith(`${ROOT}${path.sep}`), `${rel(fromFile)} references a path outside the repository: ${rawRef}`);
  return target;
}

function tags(html, name) {
  return html.match(new RegExp(`<${name}\\b[^>]*>`, 'gi')) ?? [];
}

function localScriptRefs(htmlFile) {
  return tags(read(htmlFile), 'script')
    .map(tag => attr(tag, 'src'))
    .filter(ref => ref && !isExternal(ref));
}

function inspectScriptGraph() {
  const index = path.join(ROOT, 'index.html');
  const queue = localScriptRefs(index).map(ref => resolveLocal(index, ref));
  const visited = new Set();
  const dynamicKeys = [];
  const dynamicTargets = [];

  while (queue.length) {
    const file = queue.shift();
    assert.ok(existsSync(file) && statSync(file).isFile(), `script graph references missing ${rel(file)}`);
    const key = rel(file);
    if (visited.has(key)) continue;
    visited.add(key);
    const source = read(file);
    for (const match of source.matchAll(/\bloadScript\(\s*(["'])(\.\/[^"']+\.js(?:\?[^"']*)?)\1\s*,\s*(["'])([^"']+)\3\s*\)/g)) {
      const target = resolveLocal(file, match[2]);
      assert.ok(existsSync(target), `${key} dynamically loads missing ${match[2]}`);
      dynamicTargets.push(rel(target));
      dynamicKeys.push(match[4]);
      queue.push(target);
    }
  }

  return { visited, dynamicKeys, dynamicTargets };
}

const allFiles = walk();
const htmlFiles = allFiles.filter(file => path.extname(file) === '.html');
const rootJsFiles = readdirSync(ROOT, { withFileTypes: true })
  .filter(entry => entry.isFile() && entry.name.endsWith('.js'))
  .map(entry => path.join(ROOT, entry.name));

check('required deploy files are present', () => {
  for (const name of ['.nojekyll', 'index.html', 'manifest.webmanifest', 'sw.js', 'sync.js']) {
    assert.ok(existsSync(path.join(ROOT, name)), `missing ${name}`);
  }
});

check('source files contain no unresolved merge markers', () => {
  const marker = /^(?:<{7}|={7}|>{7})(?: |$)/m;
  const hits = allFiles
    .filter(file => SOURCE_EXTENSIONS.has(path.extname(file)))
    .filter(file => marker.test(read(file)))
    .map(rel);
  assert.deepEqual(hits, [], `merge markers found in: ${hits.join(', ')}`);
});

check('root JavaScript and inline HTML scripts parse', () => {
  for (const file of rootJsFiles) new vm.Script(read(file), { filename: rel(file) });
  for (const file of htmlFiles) {
    const html = read(file);
    const inlineScripts = [...html.matchAll(/<script\b(?![^>]*\bsrc\s*=)[^>]*>([\s\S]*?)<\/script\s*>/gi)];
    inlineScripts.forEach((match, index) => new vm.Script(match[1], { filename: `${rel(file)}#inline-${index + 1}` }));
  }
});

check('HTML shells and local resource references are consistent', () => {
  for (const file of htmlFiles) {
    const html = read(file);
    assert.match(html, /^\s*<!doctype html>/i, `${rel(file)} is missing an HTML5 doctype`);
    assert.match(html, /<html\b[^>]*\blang=["']nb["']/i, `${rel(file)} is missing lang="nb"`);
    assert.match(html, /<meta\b[^>]*\bcharset=["']utf-8["']/i, `${rel(file)} is missing UTF-8 charset`);
    assert.match(html, /<meta\b[^>]*\bname=["']viewport["']/i, `${rel(file)} is missing the viewport meta tag`);
    assert.match(html, /<title>[^<]+<\/title>/i, `${rel(file)} is missing a non-empty title`);

    const staticMarkup = html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, '');
    const ids = [...staticMarkup.matchAll(/\bid\s*=\s*(["'])(.*?)\1/gi)].map(match => match[2]);
    const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
    assert.deepEqual(duplicateIds, [], `${rel(file)} has duplicate initial DOM ids: ${duplicateIds.join(', ')}`);

    const resourceTags = [...tags(html, 'script'), ...tags(html, 'link')];
    for (const tag of resourceTags) {
      const rawRef = attr(tag, tag.toLowerCase().startsWith('<script') ? 'src' : 'href');
      assert.ok(!rawRef?.startsWith('http://'), `${rel(file)} contains an insecure resource reference: ${rawRef}`);
      if (!rawRef || isExternal(rawRef)) continue;
      const target = resolveLocal(file, rawRef);
      assert.ok(existsSync(target), `${rel(file)} references missing ${rawRef}`);
    }

    const scripts = tags(html, 'script').map(tag => ({ tag, src: attr(tag, 'src') })).filter(item => item.src);
    const normalized = scripts.map(item => isExternal(item.src) ? item.src : rel(resolveLocal(file, item.src)));
    const duplicates = [...new Set(normalized.filter((src, index) => normalized.indexOf(src) !== index))];
    assert.deepEqual(duplicates, [], `${rel(file)} loads a script more than once: ${duplicates.join(', ')}`);
    for (const item of scripts.filter(item => !isExternal(item.src))) {
      assert.match(item.tag, /\b(?:defer|async|type=["']module["'])\b/i, `${rel(file)} loads ${item.src} without defer, async or module`);
    }
  }
});

check('the main shell keeps one complete navigation and boot bridge', () => {
  const html = read(path.join(ROOT, 'index.html'));
  const staticMarkup = html.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '');
  for (const id of ['login', 'content', 'nav']) assert.match(staticMarkup, new RegExp(`\\bid=["']${id}["']`), `index.html is missing #${id}`);
  const views = [...staticMarkup.matchAll(/\bdata-view\s*=\s*(["'])(.*?)\1/gi)].map(match => match[2]);
  assert.deepEqual(views, ['home', 'tasks', 'seen', 'rewards', 'us'], 'main navigation changed, is duplicated, or is incomplete');
  assert.match(html, /window\.FlytBridge\s*=/, 'index.html does not publish window.FlytBridge');
});

check('static and dynamically loaded local scripts exist without duplicate loader keys', () => {
  const { visited, dynamicKeys, dynamicTargets } = inspectScriptGraph();

  const duplicateKeys = [...new Set(dynamicKeys.filter((key, index) => dynamicKeys.indexOf(key) !== index))];
  assert.deepEqual(duplicateKeys, [], `dynamic loader keys are duplicated: ${duplicateKeys.join(', ')}`);
  const duplicateTargets = [...new Set(dynamicTargets.filter((target, index) => dynamicTargets.indexOf(target) !== index))];
  assert.deepEqual(duplicateTargets, [], `dynamic scripts are referenced more than once by the loader: ${duplicateTargets.join(', ')}`);
  assert.ok(visited.has('sync.js') && visited.has('app-watchdog.js'), 'the main script graph is missing sync.js or app-watchdog.js');
});

check('the main app creates exactly one Supabase client', () => {
  const creators = rootJsFiles.filter(file => /\bsupabase\.createClient\s*\(/.test(read(file))).map(rel);
  assert.deepEqual(creators, ['sync.js'], `expected only sync.js, found: ${creators.join(', ') || 'none'}`);
});

check('manifest metadata matches the HTML shell and GitHub Pages scope', () => {
  const indexFile = path.join(ROOT, 'index.html');
  const html = read(indexFile);
  const manifestLinks = tags(html, 'link').filter(tag => (attr(tag, 'rel') ?? '').toLowerCase().split(/\s+/).includes('manifest'));
  assert.equal(manifestLinks.length, 1, `index.html must link exactly one manifest, found ${manifestLinks.length}`);
  const manifestRef = attr(manifestLinks[0], 'href');
  assert.ok(manifestRef && !isExternal(manifestRef), 'manifest must be a local file');
  const manifestFile = resolveLocal(indexFile, manifestRef);
  const manifest = JSON.parse(read(manifestFile));
  for (const key of ['name', 'short_name', 'start_url', 'scope', 'display', 'background_color', 'theme_color']) {
    assert.ok(typeof manifest[key] === 'string' && manifest[key].trim(), `manifest is missing ${key}`);
  }
  assert.ok(['standalone', 'fullscreen', 'minimal-ui', 'browser'].includes(manifest.display), `unsupported manifest display: ${manifest.display}`);
  assert.match(manifest.background_color, /^#[\da-f]{6}$/i, 'manifest background_color must be a six-digit hex color');
  assert.match(manifest.theme_color, /^#[\da-f]{6}$/i, 'manifest theme_color must be a six-digit hex color');
  assert.ok(!manifest.start_url.startsWith('/') && !manifest.scope.startsWith('/'), 'manifest start_url and scope must stay relative for the project site');
  const base = new URL('https://example.test/Flyt-app/');
  const start = new URL(manifest.start_url, base);
  const scope = new URL(manifest.scope, base);
  assert.ok(start.href.startsWith(scope.href), `manifest start_url ${manifest.start_url} is outside scope ${manifest.scope}`);
  const themeMeta = tags(html, 'meta').find(tag => (attr(tag, 'name') ?? '').toLowerCase() === 'theme-color');
  assert.ok(themeMeta, 'index.html is missing theme-color meta');
  assert.equal(attr(themeMeta, 'content')?.toLowerCase(), manifest.theme_color.toLowerCase(), 'HTML and manifest theme colors differ');
});

check('service-worker registration and local cache references agree with the repository', () => {
  const { visited } = inspectScriptGraph();
  const sources = new Map(rootJsFiles.filter(file => visited.has(rel(file))).map(file => [file, read(file)]));
  const registrations = [];
  for (const [file, source] of sources) {
    for (const match of source.matchAll(/serviceWorker\.register\(\s*([`"'])(.+?)\1/g)) {
      registrations.push({ file, ref: match[2] });
    }
  }
  assert.ok(registrations.length > 0, 'no service worker registration was found');
  for (const registration of registrations) {
    const target = resolveLocal(registration.file, registration.ref);
    assert.ok(existsSync(target), `${rel(registration.file)} registers missing ${registration.ref}`);
    const sw = read(target);
    for (const event of ['install', 'activate', 'fetch']) {
      assert.match(sw, new RegExp(`self\\.addEventListener\\(\\s*["']${event}["']`), `${rel(target)} is missing the ${event} handler`);
    }
    assert.match(sw, /const\s+CACHE\s*=\s*["'][^"']+v\d+[^"']*["']/, `${rel(target)} needs a versioned cache name`);
    for (const match of sw.matchAll(/([`"'])(\.\/[^`"']+\.(?:html|js|css|webmanifest)(?:\?[^`"']*)?)\1/g)) {
      const cachedTarget = resolveLocal(target, match[2]);
      assert.ok(existsSync(cachedTarget), `${rel(target)} references missing ${match[2]}`);
    }
    if (/caches\.match\(\s*["']\.\/index\.html["']\s*\)/.test(sw) && !/addAll\(\[[^\]]*["']\.\/index\.html["']/s.test(sw)) {
      warnings.push(`${rel(target)} has an offline navigation fallback for index.html, but does not precache index.html; verify offline behavior manually`);
    }
  }
});

for (const warning of warnings) console.warn(`warning - ${warning}`);
console.log(`\n${passed} checks passed${warnings.length ? `, ${warnings.length} warning(s)` : ''}.`);
if (failures.length) {
  console.error(`\n${failures.length} smoke check(s) failed:`);
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}
