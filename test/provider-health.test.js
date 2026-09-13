import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  acknowledgeProviderAlert,
  readProviderHealth,
  recordProviderHealth,
  providersNeedingAlert,
  updateProviderHealth,
} from '../src/provider-health.js';

test('persists provider health in the requested data directory', async (t) => {
  const dataDirectory = await mkdtemp(join(tmpdir(), 'github-green-health-'));
  t.after(() => rm(dataDirectory, { recursive: true, force: true }));

  await recordProviderHealth({
    date: '2026-09-01',
    outcomes: { history: true, birthday: false, photo: true },
    dataDirectory,
  });

  const health = await readProviderHealth({ dataDirectory });
  assert.equal(health.providers.birthday.consecutiveFailures, 1);
  assert.equal(health.providers.history.lastOutcome, 'success');
});

test('tracks provider failures independently and only increments once per date', () => {
  const first = updateProviderHealth(null, {
    date: '2026-09-01',
    outcomes: { history: true, birthday: false, photo: false },
  });
  const repeatedFailure = updateProviderHealth(first, {
    date: '2026-09-01',
    outcomes: { history: false, birthday: false, photo: false },
  });

  assert.equal(first.providers.history.consecutiveFailures, 0);
  assert.equal(first.providers.birthday.consecutiveFailures, 1);
  assert.equal(first.providers.photo.consecutiveFailures, 1);
  assert.equal(repeatedFailure.providers.birthday.consecutiveFailures, 1);
  assert.equal(repeatedFailure.providers.history.consecutiveFailures, 0);
});

test('starts a new failure streak after a missed calendar date', () => {
  const first = updateProviderHealth(null, {
    date: '2026-09-01',
    outcomes: { history: false, birthday: true, photo: true },
  });
  const afterGap = updateProviderHealth(first, {
    date: '2026-09-03',
    outcomes: { history: false, birthday: true, photo: true },
  });

  assert.equal(afterGap.providers.history.consecutiveFailures, 1);
});

test('resets a failed provider after a successful response, including later on the same date', () => {
  const failed = updateProviderHealth(null, {
    date: '2026-09-01',
    outcomes: { history: false, birthday: true, photo: true },
  });
  const recovered = updateProviderHealth(failed, {
    date: '2026-09-01',
    outcomes: { history: true, birthday: true, photo: true },
  });

  assert.equal(recovered.providers.history.consecutiveFailures, 0);
  assert.equal(recovered.providers.history.alerted, false);
});

test('emits one alert candidate at the ten-day threshold and suppresses duplicates until recovery', () => {
  let health = null;
  for (let day = 1; day <= 10; day += 1) {
    health = updateProviderHealth(health, {
      date: `2026-09-${String(day).padStart(2, '0')}`,
      outcomes: { history: false, birthday: true, photo: true },
    });
  }

  assert.deepEqual(providersNeedingAlert(health), [{
    provider: 'history',
    consecutiveFailures: 10,
    latestFailureDate: '2026-09-10',
  }]);

  health = acknowledgeProviderAlert(health, 'history');
  health = updateProviderHealth(health, {
    date: '2026-09-11',
    outcomes: { history: false, birthday: true, photo: true },
  });
  assert.deepEqual(providersNeedingAlert(health), []);
});
