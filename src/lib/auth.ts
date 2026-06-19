const TOKEN_KEY = "offer_gateway_token";

export function getToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function logout() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(TOKEN_KEY);
  window.dispatchEvent(new Event("offer-gateway:logout"));
  window.location.assign("/login");
}

export function isAuthenticated() {
  return Boolean(getToken());
}
