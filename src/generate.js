import { createDailyEntry } from './daily-entry.js';
import { generateOfflineSections } from './offline-content.js';
import { fetchBirthdays, fetchHistoricalEvents, fetchPhotoOfDay } from './providers/wikimedia.js';
import {
  readNetworkFallbacks,
  readPreviousLiveSections,
  resolveNetworkSections,
} from './reliability.js';
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

export async function generateDailyResult({ date, now = new Date(), dataDirectory, fetchFn } = {}) {
  const entryDate = date ?? dateInChicago(now);
  const offlineSections = await generateOfflineSections(entryDate, { dataDirectory });
  const providerOptions = { fetchFn };
  const providerOutcomes = {};
  const optionsFor = (provider) => ({
    ...providerOptions,
    onResult: (success) => { providerOutcomes[provider] = success; },
  });
  const [events, birthdays, photo, fallbackSections, previousSections] = await Promise.all([
    fetchHistoricalEvents(entryDate, optionsFor('history')),
    fetchBirthdays(entryDate, optionsFor('birthday')),
    fetchPhotoOfDay(entryDate, optionsFor('photo')),
    readNetworkFallbacks(entryDate, { dataDirectory }),
    readPreviousLiveSections({ dataDirectory }),
  ]);
  const liveSections = {
    history: selectHistoricalEvent(events, entryDate),
    birthday: selectBirthday(birthdays, entryDate),
    culture: selectCultureEvent(events, entryDate),
    photo: selectPhoto(photo),
  };

  const entry = createDailyEntry(entryDate, {
    ...offlineSections,
    ...resolveNetworkSections(liveSections, fallbackSections, previousSections),
  });

  return {
    entry,
    providerOutcomes: {
      history: providerOutcomes.history === true,
      birthday: providerOutcomes.birthday === true,
      photo: providerOutcomes.photo === true,
    },
  };
}

export async function generateDailyEntry(options = {}) {
  return (await generateDailyResult(options)).entry;
}
