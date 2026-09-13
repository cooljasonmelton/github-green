import { createDailyEntry } from './daily-entry.js';
import { generateOfflineSections } from './offline-content.js';
import { fetchBirthdays, fetchHistoricalEvents, fetchPhotoOfDay } from './providers/wikimedia.js';
import { selectBirthday, selectCultureEvent, selectHistoricalEvent, selectPhoto } from './selectors/live-content.js';

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

export async function generateDailyEntry({ date, now = new Date(), dataDirectory, fetchFn } = {}) {
  const entryDate = date ?? dateInChicago(now);
  const offlineSections = await generateOfflineSections(entryDate, { dataDirectory });
  const providerOptions = { fetchFn };
  const [events, birthdays, photo] = await Promise.all([
    fetchHistoricalEvents(entryDate, providerOptions),
    fetchBirthdays(entryDate, providerOptions),
    fetchPhotoOfDay(entryDate, providerOptions),
  ]);
  const history = selectHistoricalEvent(events, entryDate);
  const birthday = selectBirthday(birthdays, entryDate);
  const culture = selectCultureEvent(events, entryDate);
  const selectedPhoto = selectPhoto(photo);

  return createDailyEntry(entryDate, {
    ...offlineSections,
    history: history && { status: 'live', ...history },
    birthday: birthday && { status: 'live', ...birthday },
    culture: culture && { status: 'live', ...culture },
    photo: selectedPhoto && { status: 'live', ...selectedPhoto },
  });
}
