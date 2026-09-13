import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { generateDailyEntry } from '../src/generate.js';

test('selects the same offline content for repeated runs on one date', async () => {
  const entry = await generateDailyEntry({ date: '2026-09-12' });
  const repeatedEntry = await generateDailyEntry({ date: '2026-09-12' });

  assert.equal(entry.date, '2026-09-12');
  assert.deepEqual(entry, repeatedEntry);
  assert.equal(entry.word.status, 'local');
  assert.equal(entry.quote.status, 'local');
  assert.equal(entry.miscellaneous.status, 'local');
});

test('selects different offline content on the following day', async () => {
  const today = await generateDailyEntry({ date: '2026-09-12' });
  const tomorrow = await generateDailyEntry({ date: '2026-09-13' });

  assert.notDeepEqual(today.word, tomorrow.word);
  assert.notDeepEqual(today.quote, tomorrow.quote);
  assert.notDeepEqual(today.miscellaneous, tomorrow.miscellaneous);
});

test('uses emergency fallbacks when every local dataset is unavailable', async () => {
  const entry = await generateDailyEntry({
    date: '2026-09-12',
    dataDirectory: join(tmpdir(), 'github-green-missing-datasets'),
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

  const entry = await generateDailyEntry({ date: '2026-09-12', dataDirectory });

  assert.equal(entry.word.status, 'fallback');
  assert.equal(entry.quote.status, 'local');
  assert.equal(entry.miscellaneous.status, 'local');
  assert.equal(entry.quote.quote, 'A test quote.');
});
