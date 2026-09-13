import assert from 'node:assert/strict';
import test from 'node:test';

import {
  selectBirthday,
  selectCultureEvent,
  selectHistoricalEvent,
  selectPhoto,
} from '../src/selectors/live-content.js';

const historicalCandidate = {
  year: 1969,
  text: 'Apollo 11 returned to Earth after the first crewed landing on the Moon.',
  title: 'Apollo 11',
  description: 'First crewed Moon landing mission',
  sourceUrl: 'https://en.wikipedia.org/wiki/Apollo_11',
};

const birthdayCandidate = {
  year: 1928,
  text: 'Maya Angelou, American poet and memoirist, was born.',
  title: 'Maya Angelou',
  description: 'American poet, memoirist, and civil rights activist',
  sourceUrl: 'https://en.wikipedia.org/wiki/Maya_Angelou',
};

const cultureCandidate = {
  year: 1971,
  text: 'The television series Example Show premieres on a national network.',
  title: 'Example Show',
  description: 'Television series',
  sourceUrl: 'https://en.wikipedia.org/wiki/Example_Show',
};

const photoCandidate = {
  title: 'File:Example.jpg',
  imageUrl: 'https://upload.wikimedia.org/example-thumbnail.jpg',
  caption: 'An example photograph.',
  creator: 'Example Photographer',
  credit: 'Own work',
  license: 'CC BY-SA 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
  sourceUrl: 'https://commons.wikimedia.org/wiki/File:Example.jpg',
};

test('selects a clear historical event and preserves its source', () => {
  const selected = selectHistoricalEvent([
    { ...historicalCandidate, text: 'A short event.', description: 'Short event' },
    historicalCandidate,
  ], '2026-09-13');

  assert.deepEqual(selected, historicalCandidate);
});

test('selects a notable birthday with a short known-for explanation', () => {
  const selected = selectBirthday([
    { ...birthdayCandidate, description: 'Person' },
    birthdayCandidate,
  ], '2026-09-13');

  assert.deepEqual(selected, {
    name: 'Maya Angelou',
    birthYear: 1928,
    knownFor: 'American poet, memoirist, and civil rights activist',
    sourceUrl: 'https://en.wikipedia.org/wiki/Maya_Angelou',
  });
});

test('selects a pop-culture event only when it matches an entertainment signal', () => {
  const selected = selectCultureEvent([
    { ...historicalCandidate, title: 'Example treaty' },
    cultureCandidate,
  ], '2026-09-13');

  assert.deepEqual(selected, cultureCandidate);
});

test('uses the provider daily photo without changing its selection', () => {
  assert.deepEqual(selectPhoto(photoCandidate), photoCandidate);
});

test('makes the same selection for the same date and input', () => {
  const equallyClearCandidates = [
    historicalCandidate,
    { ...historicalCandidate, title: 'Apollo 12', sourceUrl: 'https://en.wikipedia.org/wiki/Apollo_12' },
  ];

  assert.deepEqual(
    selectHistoricalEvent(equallyClearCandidates, '2026-09-13'),
    selectHistoricalEvent(equallyClearCandidates, '2026-09-13'),
  );
});

test('returns no selection for weak, malformed, or unmatched candidates', () => {
  assert.equal(selectHistoricalEvent([{ text: 'Too short.' }], '2026-09-13'), null);
  assert.equal(selectBirthday([{ ...birthdayCandidate, year: '1928' }], '2026-09-13'), null);
  assert.equal(selectCultureEvent([historicalCandidate], '2026-09-13'), null);
  assert.equal(selectHistoricalEvent(null, '2026-09-13'), null);
  assert.equal(selectPhoto({ ...photoCandidate, creator: '' }), null);
});
