import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { updateEmergencyHeartbeat } from '../src/emergency-heartbeat.js';

test('records an emergency heartbeat after an unexpected generator failure', async (t) => {
  const rootDirectory = await mkdtemp(join(tmpdir(), 'github-green-heartbeat-'));
  t.after(() => rm(rootDirectory, { recursive: true, force: true }));

  const status = await updateEmergencyHeartbeat({
    date: '2026-09-13',
    rootDirectory,
    generatedAt: '2026-09-13T12:00:00.000Z',
  });

  assert.equal(status.emergency, true);
  assert.equal(status.error, 'normal generator failed');
  assert.deepEqual(Object.values(status.sections), Array(7).fill({ status: 'unavailable' }));
  assert.deepEqual(JSON.parse(await readFile(join(rootDirectory, 'data', 'last-run.json'), 'utf8')), status);
});

test('uses the Chicago calendar date when an emergency date is omitted', async (t) => {
  const rootDirectory = await mkdtemp(join(tmpdir(), 'github-green-heartbeat-'));
  t.after(() => rm(rootDirectory, { recursive: true, force: true }));

  const status = await updateEmergencyHeartbeat({
    rootDirectory,
    now: new Date('2026-09-13T05:30:00.000Z'),
    generatedAt: '2026-09-13T05:30:00.000Z',
  });

  assert.equal(status.date, '2026-09-13');
});
