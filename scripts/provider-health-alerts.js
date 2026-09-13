import { providersNeedingAlert, readProviderHealth } from '../src/provider-health.js';

const health = await readProviderHealth();
for (const { provider, consecutiveFailures, latestFailureDate } of providersNeedingAlert(health)) {
  console.log([provider, consecutiveFailures, latestFailureDate].join('\t'));
}
