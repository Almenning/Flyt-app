const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '../reset.html'), 'utf8');
const script = [...html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].at(-1)[1];
const flush = () => new Promise(resolve => setImmediate(resolve));
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };

function harness(options = {}) {
  const elements = new Map();
  for (const id of ['status', 'resetForm', 'pw', 'pwAgain', 'save']) elements.set(id, {
    value: '', disabled: true, textContent: '', style: {}, attrs: {}, listeners: {},
    addEventListener(name, fn) { this.listeners[name] = fn; },
    setAttribute(name, value) { this.attrs[name] = value; },
    removeAttribute(name) { delete this.attrs[name]; }, focus() { this.focused = true; }
  });
  const timers = new Map(); let serial = 0, authListener, config;
  const updates = [], signouts = [], replaced = [];
  const session = { user: { id: 'synthetic-user' } };
  const auth = {
    onAuthStateChange(fn) { authListener = fn; return { data: { subscription: { unsubscribe() {} } } }; },
    getSession: options.getSession || (() => Promise.resolve({ data: { session: options.session === false ? null : session }, error: null })),
    updateUser(args) { updates.push(args); return options.update ? options.update(args) : Promise.resolve({ data: { user: session.user }, error: null }); },
    signOut(args) { signouts.push(args); return options.signOut ? options.signOut(args) : Promise.resolve({ error: null }); }
  };
  const context = {
    window: { supabase: options.missingSDK ? undefined : { createClient(_url, _key, supplied) { config = supplied; return { auth }; } } },
    document: { readyState: 'complete', getElementById: id => elements.get(id) },
    location: { pathname: '/Flyt-app/reset.html', hash: options.recovery === false ? '' : '#type=recovery&access_token=synthetic-only&refresh_token=synthetic-only' },
    history: { state: null, replaceState(...args) { replaced.push(args); } }, URLSearchParams,
    setTimeout(fn, ms) { const id = ++serial; timers.set(id, { fn, ms }); return id; },
    clearTimeout(id) { timers.delete(id); }
  };
  vm.runInNewContext(script, context, { filename: 'reset.html' });
  return {
    element: id => elements.get(id), updates, signouts, replaced,
    config: () => config,
    emit: (event, data = session) => authListener(event, data),
    submit(pw = 'long-password-123', again = pw) {
      elements.get('pw').value = pw; elements.get('pwAgain').value = again;
      return elements.get('resetForm').listeners.submit?.({ preventDefault() {} });
    },
    expire() { for (const [id, timer] of [...timers]) { timers.delete(id); timer.fn(); } }
  };
}

test('password reset uses the pinned local SDK, accessible labels and the signup password minimum', () => {
  assert.match(html, /vendor\/supabase-2\.116\.0\.js[^>]*defer/);
  assert.doesNotMatch(html, /cdn\.jsdelivr\.net|supabase-js@2/);
  assert.match(html, /minlength="10"/);
  assert.match(html, /label for="pw"/);
  assert.match(html, /label for="pwAgain"/);
  assert.match(html, /font-size:16px/);
  assert.match(html, /name="referrer" content="no-referrer"/);
});

test('valid recovery enables the form and keeps its session in memory only', async () => {
  const h = harness(); await flush();
  assert.equal(h.element('save').disabled, false);
  assert.equal(h.config().auth.persistSession, false);
  assert.equal(h.config().auth.autoRefreshToken, false);
  assert.equal(h.replaced.at(-1)[2], '/Flyt-app/reset.html');
});

test('an unrelated signed-in session is not a password recovery authorization', async () => {
  const h = harness({ recovery: false }); await flush();
  assert.equal(h.element('save').disabled, true);
  await h.submit(); assert.equal(h.updates.length, 0);
  assert.match(h.element('status').textContent, /ugyldig eller utløpt/);
});

test('PASSWORD_RECOVERY event can authorize recovery without awaiting auth inside the callback', async () => {
  const pending = deferred();
  const h = harness({ recovery: false, getSession: () => pending.promise });
  h.emit('PASSWORD_RECOVERY');
  assert.equal(h.element('save').disabled, false);
  pending.resolve({ data: { session: null } }); await flush();
  assert.equal(h.element('save').disabled, false);
});

test('short or mismatched passwords do not contact the server', async () => {
  const h = harness(); await flush();
  await h.submit('short');
  assert.match(h.element('status').textContent, /minst 10 tegn/);
  await h.submit('long-password-123', 'other-password-123');
  assert.match(h.element('status').textContent, /ikke like/);
  assert.equal(h.element('pwAgain').attrs['aria-invalid'], 'true');
  assert.equal(h.updates.length, 0);
});

test('double submission creates one update and clears fields after confirmed success', async () => {
  const pending = deferred(); const h = harness({ update: () => pending.promise }); await flush();
  const first = h.submit(); await h.submit();
  assert.equal(h.updates.length, 1); assert.equal(h.element('save').disabled, true);
  pending.resolve({ data: { user: {} }, error: null }); await first;
  assert.equal(h.element('pw').value, ''); assert.equal(h.element('pwAgain').value, '');
  assert.equal(h.element('save').disabled, true); assert.equal(h.signouts[0].scope, 'local');
  assert.match(h.element('status').textContent, /Passordet er endret/);
});

test('failed cleanup does not deny a password change already confirmed by the server', async () => {
  const h = harness({ signOut: () => Promise.reject(new Error('synthetic network error')) }); await flush();
  await h.submit(); assert.match(h.element('status').textContent, /Passordet er endret/);
});

test('network errors permit retry without displaying raw server error content', async () => {
  const h = harness({ update: () => Promise.reject(new Error('raw server detail must not be displayed')) }); await flush();
  await h.submit();
  assert.equal(h.element('save').disabled, false);
  assert.match(h.element('status').textContent, /Sjekk nettet/);
  assert.doesNotMatch(h.element('status').textContent, /raw server/);
});

test('expired recovery authorization disables further updates', async () => {
  const h = harness({ update: () => Promise.resolve({ error: { status: 401 } }) }); await flush();
  await h.submit(); assert.equal(h.element('save').disabled, true);
  assert.equal(h.element('pw').value, ''); assert.match(h.element('status').textContent, /utløpt eller brukt/);
});

test('recovery timeout cannot be undone by a late session response', async () => {
  const pending = deferred(); const h = harness({ getSession: () => pending.promise });
  h.expire(); await flush();
  pending.resolve({ data: { session: {} } }); await flush();
  h.emit('PASSWORD_RECOVERY');
  assert.equal(h.element('save').disabled, true);
  assert.match(h.element('status').textContent, /Kunne ikke kontrollere/);
});

test('lost update response reports uncertainty instead of falsely reporting failure or success', async () => {
  const pending = deferred(); const h = harness({ update: () => pending.promise }); await flush();
  const saving = h.submit(); h.expire(); await saving;
  assert.match(h.element('status').textContent, /kan ha blitt endret/);
  assert.equal(h.element('save').disabled, true); assert.equal(h.element('pw').value, '');
  pending.resolve({ error: null }); await flush();
  assert.match(h.element('status').textContent, /kan ha blitt endret/);
});

test('missing SDK leaves an actionable message and never enables password submission', () => {
  const h = harness({ missingSDK: true });
  assert.match(h.element('status').textContent, /kunne ikke lastes/);
  assert.equal(h.element('save').disabled, true);
});
