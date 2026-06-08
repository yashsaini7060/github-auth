const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export interface UserProfile {
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
  bio: string | null;
  public_repos: number;
  followers: number;
  html_url: string;
}

// Fetch the current session user from the backend.
// Returns null if not authenticated (401).
export async function fetchMe(): Promise<UserProfile | null> {
  const res = await fetch(`${API_URL}/auth/me`, {
    credentials: "include", // send the httpOnly session cookie cross-origin
  });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`Unexpected response: ${res.status}`);
  return res.json() as Promise<UserProfile>;
}

// Redirect the browser to the backend login route.
// The backend sets the state cookie and sends the user to GitHub.
export function initiateLogin(): void {
  window.location.href = `${API_URL}/auth/login`;
}

// Redirect the browser to the backend logout route.
// The backend clears the session cookie and redirects back to /login.
export function initiateLogout(): void {
  window.location.href = `${API_URL}/auth/logout`;
}
