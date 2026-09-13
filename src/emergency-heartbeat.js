import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const SECTION_NAMES = ['word', 'quote', 'history', 'birthday', 'photo', 'culture', 'miscellaneous'];

async function readStatus(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch {
    return null;
  }
}

function unavailableSections() {
  return Object.fromEntries(SECTION_NAMES.map((name) => [name, { status: 'unavailable' }]));
}

function dateInChicago(now) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export async function updateEmergencyHeartbeat({
  date,
  rootDirectory = process.cwd(),
  now = new Date(),
  generatedAt = new Date().toISOString(),
} = {}) {
  const entryDate = date ?? dateInChicago(now);
  const dataDirectory = join(rootDirectory, 'data');
  const statusPath = join(dataDirectory, 'last-run.json');
  const previousStatus = await readStatus(statusPath);
  const status = {
    date: entryDate,
    generatedAt,
    sections: previousStatus?.date === entryDate && previousStatus?.sections
      ? previousStatus.sections
      : unavailableSections(),
    emergency: true,
    error: 'normal generator failed',
  };

  await mkdir(dataDirectory, { recursive: true });
  await writeFile(statusPath, `${JSON.stringify(status, null, 2)}\n`);
  return status;
}
