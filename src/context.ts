import { ContextInfo, UserInfo } from './types';

const context: ContextInfo = {
  user: {},
  route: typeof location !== 'undefined' ? location.pathname + location.search : '',
  tags: {},
};

export function getContext(): ContextInfo {
  return {
    user: { ...context.user },
    route: context.route,
    tags: { ...context.tags },
  };
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
