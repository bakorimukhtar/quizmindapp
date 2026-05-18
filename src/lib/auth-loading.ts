const AUTH_LOADING_KEY = "quizmind_auth_loading";

export function setAuthLoading() {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(AUTH_LOADING_KEY, "1");
  }
}

export function consumeAuthLoading(): boolean {
  if (typeof window === "undefined") return false;
  const value = sessionStorage.getItem(AUTH_LOADING_KEY);
  if (value) {
    sessionStorage.removeItem(AUTH_LOADING_KEY);
    return true;
  }
  return false;
}
