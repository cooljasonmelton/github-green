export const SECTION_STATUSES = Object.freeze({
  LIVE: 'live',
  LOCAL: 'local',
  FALLBACK: 'fallback',
  PREVIOUS: 'previous',
  UNAVAILABLE: 'unavailable',
});

const SECTION_NAMES = Object.freeze([
  'word',
  'quote',
  'history',
  'birthday',
  'photo',
  'culture',
  'miscellaneous',
]);

function isCalendarDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().startsWith(value);
}

export function createDailyEntry(date, sections = {}) {
  if (!isCalendarDate(date)) {
    throw new TypeError('date must be a valid YYYY-MM-DD calendar date');
  }

  return {
    date,
    ...Object.fromEntries(SECTION_NAMES.map((name) => [
      name,
      { status: SECTION_STATUSES.UNAVAILABLE, ...sections[name] },
    ])),
  };
}
