const TOKEN_KEY = "offer_gateway_token";
const TOKEN_CHANGE_EVENT = "offer-gateway:token-change";

export function getToken() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.dispatchEvent(new Event(TOKEN_CHANGE_EVENT));
}

/** For `useSyncExternalStore`: notifies on login/logout, also across tabs. */
export function subscribeToToken(callback: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === TOKEN_KEY || event.key === null) callback();
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(TOKEN_CHANGE_EVENT, callback);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(TOKEN_CHANGE_EVENT, callback);
  };
}

export function logout() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(TOKEN_KEY);
  window.location.assign("/login");
}

export function isAuthenticated() {
  return Boolean(getToken());
}
