import assert from 'node:assert/strict';
import test from 'node:test';

import { createDailyEntry, SECTION_STATUSES } from '../src/daily-entry.js';

test('creates a normalized placeholder entry for a date', () => {
  const entry = createDailyEntry('2026-09-12');

  assert.deepEqual(entry, {
    date: '2026-09-12',
    word: { status: SECTION_STATUSES.UNAVAILABLE },
    quote: { status: SECTION_STATUSES.UNAVAILABLE },
    history: { status: SECTION_STATUSES.UNAVAILABLE },
    birthday: { status: SECTION_STATUSES.UNAVAILABLE },
    photo: { status: SECTION_STATUSES.UNAVAILABLE },
    culture: { status: SECTION_STATUSES.UNAVAILABLE },
    miscellaneous: { status: SECTION_STATUSES.UNAVAILABLE },
  });
});

test('rejects a date that is not in YYYY-MM-DD form', () => {
  assert.throws(() => createDailyEntry('September 12, 2026'), /YYYY-MM-DD/);
});

test('rejects a date that is not on the calendar', () => {
  assert.throws(() => createDailyEntry('2026-02-30'), /calendar date/);
});
