import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { generateDailyEntry } from '../src/generate.js';

const offlineFetch = async () => {
  throw new Error('network is disabled in tests');
};

function jsonResponse(body) {
  return { ok: true, status: 200, json: async () => body };
}

test('selects the same offline content for repeated runs on one date', async () => {
  const entry = await generateDailyEntry({ date: '2026-09-12', fetchFn: offlineFetch });
  const repeatedEntry = await generateDailyEntry({ date: '2026-09-12', fetchFn: offlineFetch });

  assert.equal(entry.date, '2026-09-12');
  assert.deepEqual(entry, repeatedEntry);
  assert.equal(entry.word.status, 'local');
  assert.equal(entry.quote.status, 'local');
  assert.equal(entry.miscellaneous.status, 'local');
});

test('selects different offline content on the following day', async () => {
  const today = await generateDailyEntry({ date: '2026-09-12', fetchFn: offlineFetch });
  const tomorrow = await generateDailyEntry({ date: '2026-09-13', fetchFn: offlineFetch });

  assert.notDeepEqual(today.word, tomorrow.word);
  assert.notDeepEqual(today.quote, tomorrow.quote);
  assert.notDeepEqual(today.miscellaneous, tomorrow.miscellaneous);
});

test('uses emergency fallbacks when every local dataset is unavailable', async () => {
  const entry = await generateDailyEntry({
    date: '2026-09-12',
    dataDirectory: join(tmpdir(), 'github-green-missing-datasets'),
    fetchFn: offlineFetch,
  });

  assert.equal(entry.word.status, 'fallback');
  assert.equal(entry.quote.status, 'fallback');
  assert.equal(entry.miscellaneous.status, 'fallback');
});

test('isolates a malformed dataset from the remaining local categories', async (t) => {
  const dataDirectory = await mkdtemp(join(tmpdir(), 'github-green-data-'));
  t.after(() => rm(dataDirectory, { recursive: true, force: true }));

  await Promise.all([
    mkdir(join(dataDirectory, 'vocabulary'), { recursive: true }),
    mkdir(join(dataDirectory, 'quotes'), { recursive: true }),
    mkdir(join(dataDirectory, 'miscellaneous'), { recursive: true }),
  ]);
  await Promise.all([
    writeFile(join(dataDirectory, 'vocabulary', 'entries.json'), '{'),
    writeFile(
      join(dataDirectory, 'quotes', 'entries.json'),
      JSON.stringify([{ quote: 'A test quote.', author: 'Test Author', source: 'Test source' }]),
    ),
    writeFile(
      join(dataDirectory, 'miscellaneous', 'entries.json'),
      JSON.stringify([{ category: 'testing', fact: 'Tests can use temporary files.' }]),
    ),
  ]);

  const entry = await generateDailyEntry({ date: '2026-09-12', dataDirectory, fetchFn: offlineFetch });

  assert.equal(entry.word.status, 'fallback');
  assert.equal(entry.quote.status, 'local');
  assert.equal(entry.miscellaneous.status, 'local');
  assert.equal(entry.quote.quote, 'A test quote.');
});

test('adds selected live sections without exposing provider response schemas', async () => {
  const entry = await generateDailyEntry({
    date: '2026-09-12',
    fetchFn: async (url) => {
      if (url.includes('/events/')) {
        return jsonResponse({ events: [{
          year: 1969,
          text: 'Apollo 11 returned to Earth after the first crewed landing on the Moon.',
          pages: [{
            titles: { normalized: 'Apollo 11' },
            description: 'First crewed Moon landing mission',
            content_urls: { desktop: { page: 'https://en.wikipedia.org/wiki/Apollo_11' } },
          }],
        }, {
          year: 1971,
          text: 'The television series Example Show premieres on a national network.',
          pages: [{
            titles: { normalized: 'Example Show' },
            description: 'Television series',
            content_urls: { desktop: { page: 'https://en.wikipedia.org/wiki/Example_Show' } },
          }],
        }] });
      }

      if (url.includes('/births/')) {
        return jsonResponse({ births: [{
          year: 1928,
          text: 'Maya Angelou, American poet and memoirist, was born.',
          pages: [{
            titles: { normalized: 'Maya Angelou' },
            description: 'American poet, memoirist, and civil rights activist',
            content_urls: { desktop: { page: 'https://en.wikipedia.org/wiki/Maya_Angelou' } },
          }],
        }] });
      }

      return jsonResponse({ image: {
        title: 'File:Example.jpg',
        thumbnail: { source: 'https://upload.wikimedia.org/example.jpg' },
        file_page: 'https://commons.wikimedia.org/wiki/File:Example.jpg',
        artist: { text: 'Example Photographer' },
        credit: { text: 'Own work' },
        license: { type: 'CC BY-SA 4.0', url: 'https://creativecommons.org/licenses/by-sa/4.0' },
        description: { text: 'An example photograph.' },
      } });
    },
  });

  assert.equal(entry.history.status, 'live');
  assert.equal(entry.birthday.name, 'Maya Angelou');
  assert.equal(entry.culture.title, 'Example Show');
  assert.equal(entry.photo.creator, 'Example Photographer');
});
