import { generateDailyResult } from '../src/generate.js';
import { writeDailyOutput } from '../src/daily-output.js';
import { recordProviderHealth } from '../src/provider-health.js';

const [date] = process.argv.slice(2);
const { entry, providerOutcomes } = await generateDailyResult({ date });
const output = await writeDailyOutput(entry);
let providerHealth;

try {
  providerHealth = await recordProviderHealth({ date: entry.date, outcomes: providerOutcomes });
} catch (error) {
  console.error(`Unable to record provider health: ${error.message}`);
}

console.log(JSON.stringify({ date: entry.date, ...output, providerHealth }, null, 2));
