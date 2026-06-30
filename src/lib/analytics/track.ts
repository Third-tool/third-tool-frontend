type Payload = Record<string, unknown>;

type Transport = (event: string, payload?: Payload) => void;

const transports: Transport[] = [];

export function registerTransport(transport: Transport) {
  transports.push(transport);
  return () => {
    const i = transports.indexOf(transport);
    if (i >= 0) transports.splice(i, 1);
  };
}

export function track(event: string, payload?: Payload) {
  for (const t of transports) {
    try {
      t(event, payload);
    } catch {
      // transports must never break callers
    }
  }
}

if (import.meta.env.DEV) {
  registerTransport((event, payload) => {
    // eslint-disable-next-line no-console
    console.debug('[track]', event, payload ?? {});
  });
}
