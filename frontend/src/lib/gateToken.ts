export type GateScope = 'visitor-entry' | 'visitor-checkout' | 'vehicle-entry' | 'vehicle-checkout';

const storagePrefix = 'officegate.gateToken.';

export function readGateToken(scope: GateScope): string | null {
  const fromHash = readTokenFromHash();
  if (fromHash) {
    sessionStorage.setItem(storagePrefix + scope, fromHash);
    clearTokenHash();
    return fromHash;
  }

  return sessionStorage.getItem(storagePrefix + scope);
}

export function requireGateToken(scope: GateScope): string {
  const token = readGateToken(scope);
  if (!token) {
    throw new Error('This scan link is missing its gate authorization token.');
  }
  return token;
}

function readTokenFromHash(): string | null {
  if (typeof window === 'undefined' || !window.location.hash) return null;
  const params = new URLSearchParams(window.location.hash.slice(1));
  return params.get('gateToken') || params.get('token');
}

function clearTokenHash(): void {
  const url = new URL(window.location.href);
  url.hash = '';
  window.history.replaceState(window.history.state, document.title, url.toString());
}
