import assert from 'node:assert/strict';
import test from 'node:test';

import {
  fetchBirthdays,
  fetchHistoricalEvents,
  fetchPhotoOfDay,
} from '../src/providers/wikimedia.js';

const eventPayload = {
  events: [{
    year: 1965,
    text: 'A space probe reaches the Moon.',
    pages: [{
      titles: { normalized: 'Example mission' },
      description: 'Example space mission',
      content_urls: { desktop: { page: 'https://en.wikipedia.org/wiki/Example_mission' } },
    }],
  }],
};

const birthPayload = {
  births: [{
    year: 1920,
    text: 'An example performer is born.',
    pages: [{
      titles: { normalized: 'Example performer' },
      description: 'Example performer',
      content_urls: { desktop: { page: 'https://en.wikipedia.org/wiki/Example_performer' } },
    }],
  }],
};

const photoPayload = {
  image: {
    title: 'File:Example.jpg',
    thumbnail: { source: 'https://upload.wikimedia.org/example-thumbnail.jpg' },
    file_page: 'https://commons.wikimedia.org/wiki/File:Example.jpg',
    artist: { text: 'Example Photographer' },
    credit: { text: 'Own work' },
    license: {
      type: 'CC BY-SA 4.0',
      url: 'https://creativecommons.org/licenses/by-sa/4.0',
    },
    description: { text: 'An example photograph.' },
  },
};

function jsonResponse(body, { ok = true, status = 200 } = {}) {
  return {
    ok,
    status,
    json: async () => body,
  };
}

test('normalizes historical-event and birthday candidates without source schemas', async () => {
  const fetchFn = async (url) => {
    if (url.includes('/events/')) {
      return jsonResponse(eventPayload);
    }

    return jsonResponse(birthPayload);
  };

  const [events, birthdays] = await Promise.all([
    fetchHistoricalEvents('2026-09-13', { fetchFn }),
    fetchBirthdays('2026-09-13', { fetchFn }),
  ]);

  assert.deepEqual(events, [{
    year: 1965,
    text: 'A space probe reaches the Moon.',
    title: 'Example mission',
    description: 'Example space mission',
    sourceUrl: 'https://en.wikipedia.org/wiki/Example_mission',
  }]);
  assert.deepEqual(birthdays, [{
    year: 1920,
    text: 'An example performer is born.',
    title: 'Example performer',
    description: 'Example performer',
    sourceUrl: 'https://en.wikipedia.org/wiki/Example_performer',
  }]);
});

test('normalizes the featured photo with attribution metadata', async () => {
  const photo = await fetchPhotoOfDay('2026-09-13', {
    fetchFn: async () => jsonResponse(photoPayload),
  });

  assert.deepEqual(photo, {
    title: 'File:Example.jpg',
    imageUrl: 'https://upload.wikimedia.org/example-thumbnail.jpg',
    caption: 'An example photograph.',
    creator: 'Example Photographer',
    credit: 'Own work',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Example.jpg',
  });
});

test('contains provider failures when a response is malformed or unsuccessful', async () => {
  const malformedEvents = await fetchHistoricalEvents('2026-09-13', {
    fetchFn: async () => jsonResponse({ events: [{}] }),
  });
  const unavailablePhoto = await fetchPhotoOfDay('2026-09-13', {
    fetchFn: async () => jsonResponse({}, { ok: false, status: 503 }),
  });

  assert.deepEqual(malformedEvents, []);
  assert.equal(unavailablePhoto, null);
});
