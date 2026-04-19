import { useCallback, useEffect, useMemo, useState } from 'react';
import OneSignal from 'react-onesignal';
import toast from 'react-hot-toast';
import { fetchStatus, sendNotification, subscribePlayer, unsubscribePlayer } from './api/client';
import type { SubscriptionStatus } from './api/client';
import './App.css';

const STORAGE_PROMPT_KEY = 'notifications_prompt_seen_v1';

/** OneSignal.init() must run once per page load; Strict Mode / HMR re-run effects otherwise. */
let oneSignalInitPromise: Promise<void> | null = null;

function ensureOneSignalInitialized(appId: string): Promise<void> {
  if (!oneSignalInitPromise) {
    oneSignalInitPromise = OneSignal.init({
      appId,
      allowLocalhostAsSecureOrigin: true,
      serviceWorkerPath: '/OneSignalSDKWorker.js',
    }).catch((err) => {
      oneSignalInitPromise = null;
      throw err;
    });
  }
  return oneSignalInitPromise;
}

function errMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function useOneSignalInit(): { ready: boolean; appId: string | undefined } {
  const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      if (!appId) {
        toast.error('Missing VITE_ONESIGNAL_APP_ID');
        return;
      }

      await ensureOneSignalInitialized(appId);

      if (!cancelled) setReady(true);
    }

    boot().catch((err: unknown) => {
      toast.error(`OneSignal init failed: ${errMessage(err)}`);
    });

    return () => {
      cancelled = true;
    };
  }, [appId]);

  return { ready, appId };
}

function readSubscriptionId(): string | null {
  try {
    const id = OneSignal.User.PushSubscription.id;
    return id || null;
  } catch {
    return null;
  }
}

function readOptedIn(): boolean {
  try {
    return Boolean(OneSignal.User.PushSubscription.optedIn);
  } catch {
    return false;
  }
}

function isAppleTouchDevice(): boolean {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return true;
  // iPadOS 13+ Safari often reports as Macintosh with touch.
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
}

function isIosStandalone(): boolean {
  return Boolean((window.navigator as unknown as { standalone?: boolean }).standalone);
}

async function waitForSubscriptionId(timeoutMs = 4000): Promise<string | null> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const id = readSubscriptionId();
    if (id) return id;
    await new Promise((r) => setTimeout(r, 150));
  }
  return readSubscriptionId();
}

export default function App() {
  const { ready } = useOneSignalInit();
  const apiConfigured = Boolean(import.meta.env.VITE_API_URL);
  const sendApiKey = import.meta.env.VITE_API_KEY?.trim() ?? '';
  const sendApiConfigured = Boolean(sendApiKey);

  const [playerId, setPlayerId] = useState<string | null>(null);
  const [segment, setSegment] = useState('general');
  const [backendStatus, setBackendStatus] = useState<SubscriptionStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [busy, setBusy] = useState(false);

  const [showPrompt, setShowPrompt] = useState(false);
  const [iosPwaHint, setIosPwaHint] = useState(false);

  useEffect(() => {
    setIosPwaHint(isAppleTouchDevice() && !isIosStandalone());
  }, []);

  const [sendTitle, setSendTitle] = useState('Hello from the demo');
  const [sendMessage, setSendMessage] = useState('Tap to open the URL you configured.');
  const [sendUrl, setSendUrl] = useState('https://example.com');
  const [sendSegment, setSendSegment] = useState('');

  const refreshPlayer = useCallback(() => {
    const id = readSubscriptionId();
    setPlayerId(id);
    return id;
  }, []);

  const refreshBackendStatus = useCallback(
    async (id: string) => {
      if (!apiConfigured || !id) {
        setBackendStatus(null);
        return;
      }
      setLoadingStatus(true);
      try {
        const status = await fetchStatus(id);
        setBackendStatus(status);
      } catch (err: unknown) {
        setBackendStatus(null);
        toast.error(errMessage(err));
      } finally {
        setLoadingStatus(false);
      }
    },
    [apiConfigured],
  );

  useEffect(() => {
    if (!ready) return;

    let cancelled = false;

    async function hydrate() {
      const id = refreshPlayer();
      if (cancelled) return;

      const optedIn = readOptedIn();
      const seen = window.localStorage.getItem(STORAGE_PROMPT_KEY) === '1';

      if (id) {
        await refreshBackendStatus(id);
      } else if (!optedIn && !seen) {
        setShowPrompt(true);
      }
    }

    void hydrate();

    const onChange = () => {
      const id = refreshPlayer();
      if (id) void refreshBackendStatus(id);
    };

    OneSignal.User.PushSubscription.addEventListener('change', onChange);

    return () => {
      cancelled = true;
      OneSignal.User.PushSubscription.removeEventListener('change', onChange);
    };
  }, [ready, refreshBackendStatus, refreshPlayer]);

  const statusLabel = useMemo(() => {
    if (!playerId) return 'No OneSignal subscription id yet';
    if (loadingStatus) return 'Checking backend…';
    if (!backendStatus) return 'Backend status unavailable';
    return backendStatus.isSubscribed ? 'Subscribed' : 'Not Subscribed';
  }, [backendStatus, loadingStatus, playerId]);

  const handleEnableFromPrompt = async () => {
    window.localStorage.setItem(STORAGE_PROMPT_KEY, '1');
    setShowPrompt(false);
    await handleSubscribe();
  };

  const handleDismissPrompt = () => {
    window.localStorage.setItem(STORAGE_PROMPT_KEY, '1');
    setShowPrompt(false);
  };

  const handleSubscribe = async () => {
    setBusy(true);
    try {
      const granted = await OneSignal.Notifications.requestPermission();
      if (!granted) {
        toast.error('Notification permission was not granted');
        return;
      }

      await OneSignal.User.PushSubscription.optIn();

      OneSignal.User.addTags({ segment });

      const id = await waitForSubscriptionId();
      if (!id) {
        toast.error('Could not read subscription id from OneSignal yet. Try again in a moment.');
        refreshPlayer();
        return;
      }

      setPlayerId(id);

      if (!apiConfigured) {
        toast.error('VITE_API_URL is not configured');
        return;
      }

      await subscribePlayer({ playerId: id, segment });
      await refreshBackendStatus(id);
      toast.success('Subscribed and synced with backend');
    } catch (err: unknown) {
      toast.error(errMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleUnsubscribe = async () => {
    const id = playerId || readSubscriptionId();
    if (!id) {
      toast.error('No active subscription id');
      return;
    }

    setBusy(true);
    try {
      await OneSignal.User.PushSubscription.optOut();
      if (apiConfigured) {
        await unsubscribePlayer({ playerId: id });
      }
      await refreshBackendStatus(id);
      toast.success('Unsubscribed locally and updated backend');
    } catch (err: unknown) {
      toast.error(errMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleSend = async () => {
    if (!sendApiKey) {
      toast.error('Set VITE_API_KEY in .env to the same value as backend API_KEY');
      return;
    }

    setBusy(true);
    try {
      await sendNotification({
        apiKey: sendApiKey,
        title: sendTitle,
        message: sendMessage,
        url: sendUrl,
        segment: sendSegment.trim() || undefined,
      });
      toast.success('Notification request accepted');
    } catch (err: unknown) {
      toast.error(errMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      {showPrompt ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="prompt-title">
          <div className="modal">
            <h3 id="prompt-title">Enable notifications?</h3>
            <p>
              Do you want to enable notifications for this demo? We will register this browser with OneSignal and your
              local API.
            </p>
            <div className="actions">
              <button type="button" onClick={() => void handleEnableFromPrompt()} disabled={!ready || busy}>
                Yes, enable
              </button>
              <button type="button" className="secondary" onClick={handleDismissPrompt} disabled={busy}>
                Not now
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <header className="hero">
        <h1>Push notification platform demo</h1>
        <p>OneSignal Web SDK, Express gateway, and PostgreSQL working together with a clear API contract.</p>
      </header>

      <div className="grid">
        <section className="card">
          <h2>Subscription panel</h2>
          {iosPwaHint ? (
            <p className="hint" role="status">
              <strong>iPhone / iPad:</strong> Apple only allows web push for this site after you add it to the Home
              Screen and open it from there (Share → Add to Home Screen → open the new icon). A regular Safari tab will
              not show the permission prompt reliably. You also need iOS / iPadOS 16.4 or newer.
            </p>
          ) : null}
          {!ready ? (
            <p className="hint" role="status">
              Starting OneSignal… Subscribe stays disabled until initialization finishes. If this hangs, confirm{' '}
              <span className="mono">VITE_ONESIGNAL_APP_ID</span> is set at build time on Railway and this site URL is
              allowed in your OneSignal web configuration.
            </p>
          ) : null}
          <div className="row">
            <span className={`pill ${backendStatus?.isSubscribed ? 'ok' : 'warn'}`}>{statusLabel}</span>
            {backendStatus?.segment ? (
              <span className="pill">
                Segment: <span className="mono">{backendStatus.segment}</span>
              </span>
            ) : null}
          </div>

          <div className="field">
            <label htmlFor="segment">Segment tag (stored in PostgreSQL + OneSignal)</label>
            <select id="segment" value={segment} onChange={(e) => setSegment(e.target.value)} disabled={busy}>
              <option value="general">general</option>
              <option value="jobs">jobs</option>
              <option value="promotions">promotions</option>
            </select>
          </div>

          <div className="actions">
            <button type="button" onClick={() => void handleSubscribe()} disabled={!ready || busy}>
              Subscribe
            </button>
            <button type="button" className="danger" onClick={() => void handleUnsubscribe()} disabled={!ready || busy}>
              Unsubscribe
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => {
                const id = refreshPlayer();
                if (id) void refreshBackendStatus(id);
              }}
              disabled={!ready || busy}
            >
              Refresh status
            </button>
          </div>

          <p className="hint">
            Player id (subscription id): <span className="mono">{playerId ?? '—'}</span>
          </p>
        </section>

        <section className="card">
          <h2>Demo notification panel</h2>
          <p className="hint">
            Calls <span className="mono">POST /send</span> using <span className="mono">VITE_API_KEY</span> from{' '}
            <span className="mono">.env</span> (must match backend <span className="mono">API_KEY</span>). The key is
            embedded in the client bundle; use only for demos.
          </p>

          <div className="field">
            <label htmlFor="title">Title</label>
            <input id="title" value={sendTitle} onChange={(e) => setSendTitle(e.target.value)} disabled={busy} />
          </div>

          <div className="field">
            <label htmlFor="message">Message</label>
            <textarea id="message" value={sendMessage} onChange={(e) => setSendMessage(e.target.value)} disabled={busy} />
          </div>

          <div className="field">
            <label htmlFor="url">URL (opened on click)</label>
            <input id="url" value={sendUrl} onChange={(e) => setSendUrl(e.target.value)} disabled={busy} />
          </div>

          <div className="field">
            <label htmlFor="sendSegment">Segment filter (optional)</label>
            <input
              id="sendSegment"
              placeholder="Leave empty to broadcast to Subscribed Users"
              value={sendSegment}
              onChange={(e) => setSendSegment(e.target.value)}
              disabled={busy}
            />
          </div>

          <div className="actions">
            <button
              type="button"
              onClick={() => void handleSend()}
              disabled={busy || !apiConfigured || !sendApiConfigured}
            >
              Send notification
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
