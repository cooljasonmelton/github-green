import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readmePath = new URL('../README.md', import.meta.url);

test('uses concise, candid copy for the pinned repository landing page', async () => {
  const readme = await readFile(readmePath, 'utf8');
  const [landingPage] = readme.split('<!-- DAILY_CONTENT_START -->');

  assert.match(landingPage, /This repository exists to make one commit to GitHub every day\./);
  assert.match(landingPage, /updates the README with unrelated daily items\. This content is secondary\./);
  assert.doesNotMatch(landingPage, /Once the content system is in place/);
  assert.doesNotMatch(landingPage, /\[!\[/);
});
