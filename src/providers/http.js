export class ProviderRequestError extends Error {
  constructor(message, { cause } = {}) {
    super(message, { cause });
    this.name = 'ProviderRequestError';
  }
}

export async function fetchJson(url, {
  fetchFn = fetch,
  headers = {},
  timeoutMs = 8_000,
} = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let response;
    try {
      response = await fetchFn(url, { headers, signal: controller.signal });
    } catch (cause) {
      throw new ProviderRequestError('request failed', { cause });
    }

    if (!response?.ok) {
      throw new ProviderRequestError(`unexpected HTTP status: ${response?.status ?? 'unknown'}`);
    }

    try {
      return await response.json();
    } catch (cause) {
      throw new ProviderRequestError('response was not valid JSON', { cause });
    }
  } finally {
    clearTimeout(timeout);
  }
}
