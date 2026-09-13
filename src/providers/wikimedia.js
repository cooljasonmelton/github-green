import { fetchJson } from './http.js';

const WIKIMEDIA_USER_AGENT = 'github-green/0.1 (https://github.com/cooljasonmelton/github-green)';
const WIKIPEDIA_REST_BASE_URL = 'https://en.wikipedia.org/api/rest_v1/feed';

function requestOptions(options) {
  return {
    ...options,
    headers: {
      Accept: 'application/json',
      'User-Agent': WIKIMEDIA_USER_AGENT,
      ...options?.headers,
    },
  };
}

function dateParts(date) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) {
    throw new TypeError('date must be in YYYY-MM-DD form');
  }

  return { year: match[1], month: match[2], day: match[3] };
}

function normalizeOnThisDayEntries(payload, key) {
  if (!Array.isArray(payload?.[key])) {
    throw new TypeError(`response did not include a ${key} list`);
  }

  return payload[key].flatMap((entry) => {
    const page = entry?.pages?.[0];
    const title = page?.titles?.normalized;
    const sourceUrl = page?.content_urls?.desktop?.page;

    if (!Number.isInteger(entry?.year)
      || typeof entry?.text !== 'string'
      || typeof title !== 'string'
      || typeof page?.description !== 'string'
      || typeof sourceUrl !== 'string') {
      return [];
    }

    return [{
      year: entry.year,
      text: entry.text,
      title,
      description: page.description,
      sourceUrl,
    }];
  });
}

function normalizePhoto(payload) {
  const image = payload?.image;
  const normalized = {
    title: image?.title,
    imageUrl: image?.thumbnail?.source,
    caption: image?.description?.text,
    creator: image?.artist?.text,
    credit: image?.credit?.text,
    license: image?.license?.type,
    licenseUrl: image?.license?.url,
    sourceUrl: image?.file_page,
  };

  if (!Object.values(normalized).every((value) => typeof value === 'string' && value.trim())) {
    throw new TypeError('featured image response was missing attribution metadata');
  }

  return normalized;
}

async function fetchOnThisDay(type, date, options) {
  try {
    const { month, day } = dateParts(date);
    const payload = await fetchJson(
      `${WIKIPEDIA_REST_BASE_URL}/onthisday/${type}/${month}/${day}`,
      requestOptions(options),
    );

    return normalizeOnThisDayEntries(payload, type);
  } catch {
    return [];
  }
}

export function fetchHistoricalEvents(date, options) {
  return fetchOnThisDay('events', date, options);
}

export function fetchBirthdays(date, options) {
  return fetchOnThisDay('births', date, options);
}

export async function fetchPhotoOfDay(date, options) {
  try {
    const { year, month, day } = dateParts(date);
    const payload = await fetchJson(
      `${WIKIPEDIA_REST_BASE_URL}/featured/${year}/${month}/${day}`,
      requestOptions(options),
    );

    return normalizePhoto(payload);
  } catch {
    return null;
  }
}
