import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { generateDailyEntry } from '../src/generate.js';

const fallbackSections = {
  history: [{ text: 'Fallback history.', sourceUrl: 'https://example.test/history' }],
  birthday: [{ name: 'Fallback person', birthYear: 1900, knownFor: 'Fallback work', sourceUrl: 'https://example.test/birthday' }],
  photo: [{ imageUrl: 'https://example.test/photo.jpg', caption: 'Fallback photo', creator: 'Fallback creator', credit: 'Fallback credit', license: 'CC0', licenseUrl: 'https://example.test/license', sourceUrl: 'https://example.test/photo' }],
  culture: [{ text: 'Fallback culture.', sourceUrl: 'https://example.test/culture' }],
};

async function makeDataDirectory(t, { fallback = fallbackSections, lastGood } = {}) {
  const dataDirectory = await mkdtemp(join(tmpdir(), 'github-green-reliability-'));
  t.after(() => rm(dataDirectory, { recursive: true, force: true }));
  if (fallback) {
    await mkdir(join(dataDirectory, 'fallback'), { recursive: true });
    await writeFile(join(dataDirectory, 'fallback', 'live-content.json'), JSON.stringify(fallback));
  }
  if (lastGood) {
    await writeFile(join(dataDirectory, 'last-good.json'), JSON.stringify({ sections: lastGood }));
  }
  return dataDirectory;
}

test('uses checked-in fallbacks for failed network sections without replacing a live section', async (t) => {
  const dataDirectory = await makeDataDirectory(t);
  const entry = await generateDailyEntry({
    date: '2026-09-13',
    dataDirectory,
    fetchFn: async (url) => {
      if (url.includes('/events/')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ events: [{
            year: 1969,
            text: 'Apollo 11 returned to Earth after the first crewed Moon landing.',
            pages: [{
              titles: { normalized: 'Apollo 11' },
              description: 'First crewed Moon landing mission',
              content_urls: { desktop: { page: 'https://example.test/apollo-11' } },
            }],
          }] }),
        };
      }
      throw new Error('provider unavailable');
    },
  });

  assert.equal(entry.history.status, 'live');
  assert.equal(entry.birthday.status, 'fallback');
  assert.equal(entry.photo.status, 'fallback');
  assert.equal(entry.culture.status, 'fallback');
});

test('uses checked-in fallbacks when every network provider is unavailable', async (t) => {
  const dataDirectory = await makeDataDirectory(t);
  const entry = await generateDailyEntry({
    date: '2026-09-13',
    dataDirectory,
    fetchFn: async () => { throw new Error('network unavailable'); },
  });

  assert.deepEqual(
    [entry.history.status, entry.birthday.status, entry.photo.status, entry.culture.status],
    ['fallback', 'fallback', 'fallback', 'fallback'],
  );
});

test('reuses a prior live value only when checked-in fallback data is missing', async (t) => {
  const dataDirectory = await makeDataDirectory(t, {
    fallback: null,
    lastGood: {
      history: { status: 'live', text: 'Yesterday history.', sourceUrl: 'https://example.test/yesterday' },
    },
  });
  const entry = await generateDailyEntry({
    date: '2026-09-13',
    dataDirectory,
    fetchFn: async () => { throw new Error('provider unavailable'); },
  });

  assert.equal(entry.history.status, 'previous');
  assert.equal(entry.history.text, 'Yesterday history.');
  assert.equal(entry.birthday.status, 'unavailable');
  assert.equal(entry.photo.status, 'unavailable');
  assert.equal(entry.culture.status, 'unavailable');
});
