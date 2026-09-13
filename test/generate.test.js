import assert from 'node:assert/strict';
import test from 'node:test';

import { generateDailyEntry } from '../src/generate.js';

test('generates a placeholder entry for the requested date', async () => {
  const entry = await generateDailyEntry({ date: '2026-09-12' });

  assert.equal(entry.date, '2026-09-12');
  assert.equal(entry.word.status, 'unavailable');
});
