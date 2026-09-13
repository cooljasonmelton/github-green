import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const NETWORK_SECTION_NAMES = ['history', 'birthday', 'photo', 'culture'];
const DEFAULT_DATA_DIRECTORY = fileURLToPath(new URL('../data', import.meta.url));

function hasStrings(value, keys) {
  return Boolean(value) && keys.every((key) => typeof value[key] === 'string' && value[key].trim());
}

function isValidSection(name, value) {
  if (name === 'birthday') {
    return hasStrings(value, ['name', 'knownFor', 'sourceUrl']) && Number.isInteger(value.birthYear);
  }

  if (name === 'photo') {
    return hasStrings(value, ['imageUrl', 'caption', 'creator', 'credit', 'license', 'licenseUrl', 'sourceUrl']);
  }

  return hasStrings(value, ['text', 'sourceUrl']);
}

function selectForDate(entries, date) {
  if (!Array.isArray(entries) || entries.length === 0) return null;
  const day = Math.floor(Date.parse(`${date}T00:00:00.000Z`) / 86_400_000);
  return entries[((day % entries.length) + entries.length) % entries.length];
}

async function readJson(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch {
    return null;
  }
}

export async function readNetworkFallbacks(date, { dataDirectory = DEFAULT_DATA_DIRECTORY } = {}) {
  const data = await readJson(join(dataDirectory, 'fallback', 'live-content.json'));

  return Object.fromEntries(NETWORK_SECTION_NAMES.flatMap((name) => {
    const value = selectForDate(data?.[name], date);
    return isValidSection(name, value) ? [[name, value]] : [];
  }));
}

export async function readPreviousLiveSections({ dataDirectory = DEFAULT_DATA_DIRECTORY } = {}) {
  const data = await readJson(join(dataDirectory, 'last-good.json'));

  return Object.fromEntries(NETWORK_SECTION_NAMES.flatMap((name) => {
    const value = data?.sections?.[name];
    return isValidSection(name, value) ? [[name, value]] : [];
  }));
}

export function resolveNetworkSections(liveSections, fallbackSections, previousSections) {
  return Object.fromEntries(NETWORK_SECTION_NAMES.map((name) => {
    if (isValidSection(name, liveSections[name])) {
      return [name, { ...liveSections[name], status: 'live' }];
    }

    if (isValidSection(name, fallbackSections[name])) {
      return [name, { ...fallbackSections[name], status: 'fallback' }];
    }

    if (isValidSection(name, previousSections[name])) {
      return [name, { ...previousSections[name], status: 'previous' }];
    }

    return [name, { status: 'unavailable' }];
  }));
}
