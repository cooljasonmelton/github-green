import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { writeDailyOutput } from '../src/daily-output.js';

const entry = {
  date: '2026-09-12',
  word: { status: 'local', word: 'lucid', partOfSpeech: 'adjective', definition: 'Clear.', example: 'A lucid note.' },
  quote: { status: 'local', quote: 'A clear quote.', author: 'Example Author', source: 'Example Book' },
  history: { status: 'live', text: 'A clear historical event happened on this date.', sourceUrl: 'https://example.com/history' },
  birthday: { status: 'live', name: 'Example Person', birthYear: 1900, knownFor: 'Example work', sourceUrl: 'https://example.com/person' },
  photo: { status: 'live', imageUrl: 'https://example.com/photo.jpg', caption: 'Example photo', creator: 'Example Creator', credit: 'Own work', license: 'CC BY-SA 4.0', licenseUrl: 'https://example.com/license', sourceUrl: 'https://example.com/photo' },
  culture: { status: 'live', text: 'An example film premieres on this date.', sourceUrl: 'https://example.com/culture' },
  miscellaneous: { status: 'local', category: 'science', fact: 'An example fact.' },
};

test('writes marker-safe README content, an archive, and stable same-day status', async (t) => {
  const rootDirectory = await mkdtemp(join(tmpdir(), 'github-green-output-'));
  t.after(() => rm(rootDirectory, { recursive: true, force: true }));
  await writeFile(join(rootDirectory, 'README.md'), '# Intro\n\n<!-- DAILY_CONTENT_START -->\nold\n<!-- DAILY_CONTENT_END -->\n\nFooter\n');

  await writeDailyOutput(entry, { rootDirectory, generatedAt: '2026-09-12T12:00:00.000Z' });
  await writeDailyOutput(entry, { rootDirectory, generatedAt: '2026-09-12T13:00:00.000Z' });

  const [readme, archive, status, lastGood] = await Promise.all([
    readFile(join(rootDirectory, 'README.md'), 'utf8'),
    readFile(join(rootDirectory, 'archive', '2026-09-12.md'), 'utf8'),
    readFile(join(rootDirectory, 'data', 'last-run.json'), 'utf8'),
    readFile(join(rootDirectory, 'data', 'last-good.json'), 'utf8'),
  ]);

  assert.match(readme, /^# Intro/m);
  assert.match(readme, /Footer/);
  assert.match(readme, /Example Creator/);
  assert.match(archive, /## Today — 2026-09-12/);
  assert.deepEqual(JSON.parse(status), {
    date: '2026-09-12',
    generatedAt: '2026-09-12T12:00:00.000Z',
    sections: Object.fromEntries(Object.entries(entry).filter(([key]) => key !== 'date').map(([key, value]) => [key, { status: value.status }])),
  });
  assert.deepEqual(JSON.parse(lastGood).sections.history, entry.history);
});

test('records malformed README markers without rewriting the README', async (t) => {
  const rootDirectory = await mkdtemp(join(tmpdir(), 'github-green-output-'));
  t.after(() => rm(rootDirectory, { recursive: true, force: true }));
  const readmePath = join(rootDirectory, 'README.md');
  await writeFile(readmePath, '# Intro only\n');

  const output = await writeDailyOutput(entry, { rootDirectory });

  assert.equal(output.readmeChanged, false);
  assert.deepEqual(output.problems, [{ code: 'README_MARKERS_INVALID' }]);
  assert.equal(await readFile(readmePath, 'utf8'), '# Intro only\n');
  assert.deepEqual(JSON.parse(await readFile(join(rootDirectory, 'data', 'last-run.json'), 'utf8')).problems, [{ code: 'README_MARKERS_INVALID' }]);
});
