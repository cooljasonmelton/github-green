import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const workflowPath = new URL('../.github/workflows/daily.yml', import.meta.url);

test('defines a Chicago-aware daily workflow with fallback generation and an empty-commit heartbeat', async () => {
  const workflow = await readFile(workflowPath, 'utf8');

  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /cron: '17 7 \* \* \*'/);
  assert.match(workflow, /timezone: 'America\/Chicago'/);
  assert.match(workflow, /contents: write/);
  assert.match(workflow, /issues: write/);
  assert.match(workflow, /actions\/setup-node@v5/);
  assert.doesNotMatch(workflow, /actions\/setup-node@v4/);
  assert.match(workflow, /npm run generate --/);
  assert.match(workflow, /npm run generate:emergency --/);
  assert.match(workflow, /provider-health-alerts/);
  assert.match(workflow, /Alert on persistent provider outages[\s\S]*continue-on-error: true/);
  assert.match(workflow, /git commit --allow-empty -m "daily: \$DATE"/);
  assert.match(workflow, /git rebase "origin\/\$DEFAULT_BRANCH"/);
  assert.match(workflow, /COMMIT_NAME/);
  assert.match(workflow, /COMMIT_EMAIL/);
});
