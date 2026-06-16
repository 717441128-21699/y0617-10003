import { ContextInfo, UserInfo, SessionInfo } from './types';

function genSessionId(): string {
  const t = Date.now().toString(36);
  const r = Math.random().toString(36).slice(2, 10);
  return `${t}-${r}`;
}

const context: ContextInfo = {
  user: {},
  route: typeof location !== 'undefined' ? location.pathname + location.search + location.hash : '',
  tags: {},
};

let session: SessionInfo | null = null;

export function initSession(): void {
  session = {
    sessionId: genSessionId(),
    startTime: Date.now(),
  };
}

export function getSession(): SessionInfo {
  if (!session) {
    initSession();
  }
  return session!;
}

export function getStayDuration(): number {
  const s = getSession();
  return Date.now() - s.startTime;
}

export function getContext(): ContextInfo {
  return {
    user: { ...context.user },
    route: context.route,
    tags: { ...context.tags },
  };
}

export function getCurrentRoute(): string {
  return context.route;
}

export function setUser(user: UserInfo): void {
  context.user = { ...context.user, ...user };
}

export function setRoute(route: string): void {
  context.route = route;
}

export function setTags(tags: Record<string, string>): void {
  context.tags = { ...context.tags, ...tags };
}

function updateRouteFromLocation(): void {
  context.route = location.pathname + location.search + location.hash;
}

function patchHistoryMethod(method: 'pushState' | 'replaceState'): void {
  const original = history[method];
  history[method] = function (...args: Parameters<typeof history.pushState>) {
    original.apply(this, args);
    updateRouteFromLocation();
  };
}

export function watchRouteChanges(): void {
  if (typeof history === 'undefined') return;

  patchHistoryMethod('pushState');
  patchHistoryMethod('replaceState');

  window.addEventListener('popstate', updateRouteFromLocation);
  window.addEventListener('hashchange', updateRouteFromLocation);
}
