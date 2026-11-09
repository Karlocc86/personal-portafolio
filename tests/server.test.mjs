import assert from 'node:assert/strict';
import { request as httpRequest } from 'node:http';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { after, before, test } from 'node:test';
import { createAppServer } from '../build-server/server.js';

let directory;
let server;
let origin;
let validationDirectory;

before(async () => {
  directory = await mkdtemp(join(tmpdir(), 'kscc-http-test-'));
  const staticDirectory = join(directory, 'dist');
  validationDirectory = join(directory, 'public', '.well-known');
  await Promise.all([
    mkdir(join(staticDirectory, '.well-known', 'pki-validation'), { recursive: true }),
    mkdir(join(validationDirectory, 'pki-validation'), { recursive: true }),
    mkdir(join(validationDirectory, 'acme-challenge'), { recursive: true }),
  ]);
  await Promise.all([
    writeFile(join(staticDirectory, 'index.html'), '<h1>Karlo Sebastian Cadena Cota</h1>'),
    writeFile(join(staticDirectory, 'style.css'), 'body { color: black; }'),
    writeFile(join(staticDirectory, '.env'), 'PRIVATE_TOKEN=not-public'),
    writeFile(join(directory, 'outside.txt'), 'outside the public directory'),
    writeFile(join(staticDirectory, '.well-known', 'pki-validation', 'built.txt'), 'built validation\n'),
    writeFile(join(staticDirectory, '.well-known', 'pki-validation', 'current.txt'), 'old validation'),
    writeFile(join(validationDirectory, 'pki-validation', 'current.txt'), 'hash\nsectigo.com\nunique-value\n'),
    writeFile(join(validationDirectory, 'acme-challenge', 'token_123-abc'), 'token_123-abc.account-thumbprint'),
  ]);
  server = createAppServer({ staticDirectory, validationDirectory });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  origin = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  if (directory) {
    const cleanupDirectory = resolve(directory);
    assert.equal(dirname(cleanupDirectory), resolve(tmpdir()));
    assert.ok(basename(cleanupDirectory).startsWith('kscc-http-test-'));
    await rm(cleanupDirectory, { recursive: true, force: true });
  }
});

test('serves the built homepage and assets with correct types', async () => {
  const home = await fetch(origin);
  assert.equal(home.status, 200);
  assert.match(home.headers.get('content-type'), /^text\/html/);
  assert.match(await home.text(), /Karlo Sebastian Cadena Cota/);
  const css = await fetch(`${origin}/style.css`);
  assert.equal(css.status, 200);
  assert.match(css.headers.get('content-type'), /^text\/css/);
});

test('serves exact live validation content before the build copy, without redirects', async () => {
  const response = await fetch(`${origin}/.well-known/pki-validation/current.txt`, { redirect: 'manual' });
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /^text\/plain/);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('location'), null);
  assert.equal(await response.text(), 'hash\nsectigo.com\nunique-value\n');
});

test('supports extensionless ACME tokens and newly added validation files without a rebuild', async () => {
  const acme = await fetch(`${origin}/.well-known/acme-challenge/token_123-abc`);
  assert.equal(acme.status, 200);
  assert.equal(await acme.text(), 'token_123-abc.account-thumbprint');
  await writeFile(join(validationDirectory, 'pki-validation', 'new-file.txt'), 'new exact content');
  const added = await fetch(`${origin}/.well-known/pki-validation/new-file.txt`);
  assert.equal(added.status, 200);
  assert.equal(await added.text(), 'new exact content');
});

test('uses validation files included in a static build when no live file exists', async () => {
  const response = await fetch(`${origin}/.well-known/pki-validation/built.txt`);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'built validation\n');
});

test('HEAD returns the same metadata with no body', async () => {
  const response = await fetch(`${origin}/.well-known/pki-validation/current.txt`, { method: 'HEAD' });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-length'), String(Buffer.byteLength('hash\nsectigo.com\nunique-value\n')));
  assert.equal(await response.text(), '');
});

test('missing validation files and unknown routes return 404, never the homepage', async () => {
  for (const path of ['/.well-known/pki-validation/missing.txt', '/.well-known/acme-challenge/missing', '/missing', '/.well-known/pki-validation/']) {
    const response = await fetch(`${origin}${path}`);
    assert.equal(response.status, 404, path);
    assert.doesNotMatch(await response.text(), /Karlo Sebastian/);
  }
});

test('does not expose hidden files or accept mutations', async () => {
  const hidden = await fetch(`${origin}/.env`);
  assert.equal(hidden.status, 404);
  const post = await fetch(`${origin}/.well-known/pki-validation/current.txt`, { method: 'POST', body: 'replacement' });
  assert.equal(post.status, 405);
  assert.equal(post.headers.get('allow'), 'GET, HEAD');
});

function rawGet(path) {
  return new Promise((resolve, reject) => {
    const req = httpRequest(`${origin}/`, { path }, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { body += chunk; });
      response.on('end', () => resolve({ status: response.statusCode, body }));
    });
    req.on('error', reject);
    req.end();
  });
}

test('rejects malformed URLs and raw or encoded traversal attempts', async () => {
  for (const path of ['/../outside.txt', '/%2e%2e/outside.txt', '/.well-known/pki-validation/..%2f..%2foutside.txt', '/%5c..%5coutside.txt', '/%00', '/%zz']) {
    const response = await rawGet(path);
    assert.equal(response.status, 400, path);
    assert.doesNotMatch(response.body, /outside the public directory/);
  }
});
