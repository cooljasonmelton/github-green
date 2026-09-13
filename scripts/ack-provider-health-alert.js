import {
  acknowledgeProviderAlert,
  readProviderHealth,
  writeProviderHealth,
} from '../src/provider-health.js';

const [provider] = process.argv.slice(2);
const health = await readProviderHealth();

if (!health || !provider) {
  throw new Error('provider health and provider name are required');
}

await writeProviderHealth(acknowledgeProviderAlert(health, provider));
