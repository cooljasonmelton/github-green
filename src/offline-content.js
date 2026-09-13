import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

import { SECTION_STATUSES } from './daily-entry.js';

const DEFAULT_DATA_DIRECTORY = fileURLToPath(new URL('../data', import.meta.url));

const DATASETS = Object.freeze({
  word: {
    path: ['vocabulary', 'entries.json'],
    fallback: {
      word: 'steady',
      partOfSpeech: 'adjective',
      definition: 'Firmly fixed, supported, or balanced.',
      example: 'A steady routine makes small progress easier to notice.',
    },
    isValid: (entry) => hasStrings(entry, ['word', 'partOfSpeech', 'definition', 'example']),
  },
  quote: {
    path: ['quotes', 'entries.json'],
    fallback: {
      quote: 'To thine own self be true.',
      author: 'William Shakespeare',
      source: 'Hamlet, Act 1, Scene 3',
    },
    isValid: (entry) => hasStrings(entry, ['quote', 'author', 'source']),
  },
  miscellaneous: {
    path: ['miscellaneous', 'entries.json'],
    fallback: {
      category: 'science',
      fact: 'Light from the Sun reaches Earth in about eight minutes and twenty seconds.',
    },
    isValid: (entry) => hasStrings(entry, ['category', 'fact']),
  },
});

function hasStrings(entry, keys) {
  return Boolean(entry)
    && keys.every((key) => typeof entry[key] === 'string' && entry[key].trim());
}

function selectForDate(entries, date) {
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new TypeError('dataset must contain at least one entry');
  }

  const day = Math.floor(Date.parse(`${date}T00:00:00.000Z`) / 86_400_000);
  return entries[((day % entries.length) + entries.length) % entries.length];
}

async function readSelectedEntry({ path, fallback, isValid }, date, dataDirectory) {
  try {
    const text = await readFile(join(dataDirectory, ...path), 'utf8');
    const entry = selectForDate(JSON.parse(text), date);

    if (!isValid(entry)) {
      throw new TypeError('dataset entry has an invalid shape');
    }

    return { status: SECTION_STATUSES.LOCAL, ...entry };
  } catch {
    return { status: SECTION_STATUSES.FALLBACK, ...fallback };
  }
}

export async function generateOfflineSections(date, {
  dataDirectory = DEFAULT_DATA_DIRECTORY,
} = {}) {
  const sections = await Promise.all(
    Object.entries(DATASETS).map(async ([name, dataset]) => [
      name,
      await readSelectedEntry(dataset, date, dataDirectory),
    ]),
  );

  return Object.fromEntries(sections);
}
