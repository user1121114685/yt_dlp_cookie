import assert from 'node:assert/strict';
import test from 'node:test';

let moduleId = 0;

const createBackground = async (
  t,
  tab = {
    id: 374290960,
    url: 'https://www.youtube.com/watch?v=g6J5fcHsWFU',
  },
) => {
  const originalChrome = Object.getOwnPropertyDescriptor(globalThis, 'chrome');
  t.after(() => {
    if (originalChrome) {
      Object.defineProperty(globalThis, 'chrome', originalChrome);
    } else {
      Reflect.deleteProperty(globalThis, 'chrome');
    }
  });
  const listeners = new Map();
  const event = (name) => ({
    addListener: (listener) => listeners.set(name, listener),
  });
  const errors = t.mock.method(console, 'error', () => {});
  const chrome = {
    tabs: {
      query: t.mock.fn(async () => (tab ? [tab] : [])),
      onUpdated: event('tabs.onUpdated'),
      onActivated: event('tabs.onActivated'),
    },
    cookies: {
      getAll: t.mock.fn(async () => [{ name: 'synthetic-test-cookie' }]),
      onChanged: event('cookies.onChanged'),
    },
    action: { setBadgeText: t.mock.fn(async () => {}) },
    windows: { onFocusChanged: event('windows.onFocusChanged') },
    runtime: {
      getManifest: () => ({ incognito: 'split', version: '0.8.2' }),
      onInstalled: event('runtime.onInstalled'),
    },
    notifications: { onButtonClicked: event('notifications.onButtonClicked') },
  };
  globalThis.chrome = chrome;
  await import(`../src/background.mjs?test=${++moduleId}`);
  return { chrome, listeners, errors, update: listeners.get('tabs.onUpdated') };
};

test('updates the active tab badge with the cookie count', async (t) => {
  const { chrome, listeners, errors, update } = await createBackground(t);
  for (const name of [
    'cookies.onChanged',
    'tabs.onUpdated',
    'tabs.onActivated',
    'windows.onFocusChanged',
  ]) {
    assert.equal(listeners.get(name), update);
  }
  await update();
  assert.deepEqual(chrome.action.setBadgeText.mock.calls[0].arguments, [
    { tabId: 374290960, text: '2' },
  ]);
  assert.equal(errors.mock.callCount(), 0);
});

test('does nothing when no active tab exists', async (t) => {
  const { chrome, update } = await createBackground(t, null);
  await update();
  assert.equal(chrome.cookies.getAll.mock.callCount(), 0);
  assert.equal(chrome.action.setBadgeText.mock.callCount(), 0);
});

test('clears the badge when the active tab has no URL', async (t) => {
  const { chrome, update } = await createBackground(t, { id: 374290960 });
  await update();
  assert.deepEqual(chrome.action.setBadgeText.mock.calls[0].arguments, [
    { tabId: 374290960, text: '' },
  ]);
  assert.equal(chrome.cookies.getAll.mock.callCount(), 0);
});

test('handles a tab closing while cookies are being read', async (t) => {
  const { chrome, errors, update } = await createBackground(t);
  let releaseCookies;
  let notifyReadStarted;
  let closed = false;
  const readStarted = new Promise((resolve) => {
    notifyReadStarted = resolve;
  });
  const pendingCookies = new Promise((resolve) => {
    releaseCookies = resolve;
  });
  chrome.cookies.getAll.mock.mockImplementation(async ({ partitionKey }) => {
    if (partitionKey) return [];
    notifyReadStarted();
    return pendingCookies;
  });
  chrome.action.setBadgeText.mock.mockImplementation(async () => {
    if (closed) throw new Error('No tab with id: 374290960.');
  });
  const updating = update();
  await readStarted;
  closed = true;
  releaseCookies([]);
  await updating;
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(chrome.action.setBadgeText.mock.callCount(), 1);
  assert.equal(errors.mock.callCount(), 0);
});

test('handles a tab closing while its badge is being cleared', async (t) => {
  const { chrome, errors, update } = await createBackground(t, {
    id: 374290960,
  });
  chrome.action.setBadgeText.mock.mockImplementation(async () => {
    throw new Error('No tab with id: 374290960.');
  });
  await update();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(errors.mock.callCount(), 0);
});

test('reports unexpected badge failures instead of silently hiding them', async (t) => {
  const { chrome, errors, update } = await createBackground(t);
  const failure = new Error('Unexpected badge API failure');
  chrome.action.setBadgeText.mock.mockImplementation(async () => {
    throw failure;
  });
  await update();
  assert.equal(errors.mock.callCount(), 1);
  assert.deepEqual(errors.mock.calls[0].arguments, [
    'Failed to update cookie badge:',
    failure,
  ]);
});

test('handles query failures without rejecting the event listener', async (t) => {
  const { chrome, errors, update } = await createBackground(t);
  const failure = new Error('Unexpected query failure');
  chrome.tabs.query.mock.mockImplementation(async () => {
    throw failure;
  });
  await update();
  assert.equal(chrome.action.setBadgeText.mock.callCount(), 0);
  assert.deepEqual(errors.mock.calls[0].arguments, [
    'Failed to update cookie badge:',
    failure,
  ]);
});
