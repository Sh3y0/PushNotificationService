const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? '';

type JsonRecord = Record<string, unknown>;

async function parseJsonResponse(res: Response): Promise<unknown | null> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { error: text };
  }
}

function readErrorMessage(body: unknown, fallback: string): string {
  if (body && typeof body === 'object' && 'error' in body) {
    const err = (body as JsonRecord).error;
    return typeof err === 'string' ? err : fallback;
  }
  return fallback;
}

export type SubscriptionStatus = {
  isSubscribed: boolean;
  segment: string;
};

export async function subscribePlayer(params: { playerId: string; segment: string }): Promise<unknown> {
  const res = await fetch(`${API_URL}/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(readErrorMessage(body, `Subscribe failed (${res.status})`));
  }
  return body;
}

export async function unsubscribePlayer(params: { playerId: string }): Promise<unknown> {
  const res = await fetch(`${API_URL}/unsubscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(readErrorMessage(body, `Unsubscribe failed (${res.status})`));
  }
  return body;
}

export async function fetchStatus(playerId: string): Promise<SubscriptionStatus> {
  const res = await fetch(`${API_URL}/status/${encodeURIComponent(playerId)}`);
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(readErrorMessage(body, `Status failed (${res.status})`));
  }
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid status response');
  }
  const o = body as JsonRecord;
  return {
    isSubscribed: Boolean(o.isSubscribed),
    segment: typeof o.segment === 'string' ? o.segment : 'general',
  };
}

export async function sendNotification(params: {
  apiKey: string;
  title: string;
  message: string;
  url: string;
  segment?: string;
}): Promise<unknown> {
  const res = await fetch(`${API_URL}/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': params.apiKey,
    },
    body: JSON.stringify({
      title: params.title,
      message: params.message,
      url: params.url,
      ...(params.segment ? { segment: params.segment } : {}),
    }),
  });
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(readErrorMessage(body, `Send failed (${res.status})`));
  }
  return body;
}
