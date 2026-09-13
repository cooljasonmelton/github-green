import { createDailyEntry } from './daily-entry.js';

function dateInChicago(now) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const values = Object.fromEntries(
    parts
      .filter(({ type }) => type !== 'literal')
      .map(({ type, value }) => [type, value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
}

export async function generateDailyEntry({ date, now = new Date() } = {}) {
  return createDailyEntry(date ?? dateInChicago(now));
}
