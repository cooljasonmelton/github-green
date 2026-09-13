import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const PROVIDER_NAMES = ['history', 'birthday', 'photo'];
const ALERT_THRESHOLD = 10;
const DEFAULT_DATA_DIRECTORY = fileURLToPath(new URL('../data', import.meta.url));

function emptyProvider() {
  return {
    consecutiveFailures: 0,
    lastCheckedDate: null,
    lastFailureDate: null,
    lastOutcome: null,
    alerted: false,
  };
}

function normalizeProvider(value) {
  return { ...emptyProvider(), ...value };
}

function followsPreviousDate(date, previousDate) {
  return typeof previousDate === 'string'
    && Date.parse(`${date}T00:00:00.000Z`) - Date.parse(`${previousDate}T00:00:00.000Z`) === 86_400_000;
}

function updateProvider(provider, date, success) {
  const current = normalizeProvider(provider);

  if (current.lastCheckedDate === date) {
    if (success && current.lastOutcome !== 'success') {
      return {
        ...current,
        consecutiveFailures: 0,
        lastOutcome: 'success',
        alerted: false,
      };
    }
    return current;
  }

  if (success) {
    return {
      ...current,
      consecutiveFailures: 0,
      lastCheckedDate: date,
      lastOutcome: 'success',
      alerted: false,
    };
  }

  return {
    ...current,
    consecutiveFailures: followsPreviousDate(date, current.lastCheckedDate)
      ? current.consecutiveFailures + 1
      : 1,
    lastCheckedDate: date,
    lastFailureDate: date,
    lastOutcome: 'failure',
  };
}

export function updateProviderHealth(existing, { date, outcomes }) {
  return {
    version: 1,
    providers: Object.fromEntries(PROVIDER_NAMES.map((name) => [
      name,
      typeof outcomes?.[name] === 'boolean'
        ? updateProvider(existing?.providers?.[name], date, outcomes[name])
        : normalizeProvider(existing?.providers?.[name]),
    ])),
  };
}

export function providersNeedingAlert(health) {
  return PROVIDER_NAMES.flatMap((provider) => {
    const value = normalizeProvider(health?.providers?.[provider]);
    return value.consecutiveFailures >= ALERT_THRESHOLD && !value.alerted
      ? [{
        provider,
        consecutiveFailures: value.consecutiveFailures,
        latestFailureDate: value.lastFailureDate,
      }]
      : [];
  });
}

export function acknowledgeProviderAlert(health, provider) {
  if (!PROVIDER_NAMES.includes(provider)) return health;

  return {
    version: 1,
    providers: {
      ...health.providers,
      [provider]: { ...normalizeProvider(health.providers?.[provider]), alerted: true },
    },
  };
}

export async function readProviderHealth({ dataDirectory = DEFAULT_DATA_DIRECTORY } = {}) {
  try {
    return JSON.parse(await readFile(join(dataDirectory, 'provider-health.json'), 'utf8'));
  } catch {
    return null;
  }
}

export async function writeProviderHealth(health, { dataDirectory = DEFAULT_DATA_DIRECTORY } = {}) {
  await mkdir(dataDirectory, { recursive: true });
  await writeFile(join(dataDirectory, 'provider-health.json'), `${JSON.stringify(health, null, 2)}\n`);
}

export async function recordProviderHealth({ date, outcomes, dataDirectory } = {}) {
  const existing = await readProviderHealth({ dataDirectory });
  const health = updateProviderHealth(existing, { date, outcomes });
  await writeProviderHealth(health, { dataDirectory });
  return health;
}
