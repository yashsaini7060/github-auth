import { Router } from "express";
import type { Request, Response } from "express";
import { generateState, setStateCookie, getStateCookie, clearStateCookie } from "./oauth-state.js";
import { createSession, destroySession, getSession } from "./session.js";

const router = Router();

// ── GET /auth/login ──────────────────────────────────────────────────────────
// Generates CSRF state, stores it in a cookie, redirects user to GitHub
router.get("/login", (_req: Request, res: Response) => {
  const state = generateState();
  setStateCookie(res, state);

  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID!,
    redirect_uri: `${process.env.BACKEND_URL}/auth/callback`,
    scope: "read:user user:email",
    state,
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

// ── GET /auth/callback ───────────────────────────────────────────────────────
// GitHub redirects here after user approves (or denies) access
router.get("/callback", async (req: Request, res: Response) => {
  const { code, state: returnedState, error } = req.query as Record<string, string>;
  const frontendUrl = process.env.FRONTEND_URL!;

  if (error) {
    return res.redirect(`${frontendUrl}/login?error=${error}`);
  }

  if (!code || !returnedState) {
    return res.redirect(`${frontendUrl}/login?error=missing_params`);
  }

  // CSRF validation
  const storedState = getStateCookie(req);
  clearStateCookie(res);

  if (!storedState || storedState !== returnedState) {
    return res.redirect(`${frontendUrl}/login?error=state_mismatch`);
  }

  // Step 1: Exchange code for access token (server → GitHub, secret stays here)
  let accessToken: string;
  try {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json", // Without this GitHub returns form-encoded text
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${process.env.BACKEND_URL}/auth/callback`,
      }),
    });

    const tokenData = await tokenRes.json() as { access_token?: string; error?: string };

    if (tokenData.error || !tokenData.access_token) {
      console.error("Token exchange error:", tokenData);
      return res.redirect(`${frontendUrl}/login?error=token_exchange_failed`);
    }

    accessToken = tokenData.access_token;
  } catch (err) {
    console.error("Token fetch failed:", err);
    return res.redirect(`${frontendUrl}/login?error=token_fetch_failed`);
  }

  // Step 2: Fetch user profile from GitHub API
  try {
    const [userRes, emailsRes] = await Promise.all([
      fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "User-Agent": "github-oauth-demo",
        },
      }),
      fetch("https://api.github.com/user/emails", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "User-Agent": "github-oauth-demo",
        },
      }),
    ]);

    const userData = await userRes.json() as {
      login: string; name?: string; email?: string; avatar_url: string;
      bio?: string; public_repos?: number; followers?: number; html_url: string;
    };
    const emailsData = await emailsRes.json() as Array<{ email: string; primary: boolean; verified: boolean }>;

    const primaryEmail = Array.isArray(emailsData)
      ? emailsData.find((e) => e.primary && e.verified)?.email ?? null
      : null;

    // Step 3: Create signed httpOnly session cookie
    createSession(res, {
      accessToken,
      user: {
        login: userData.login,
        name: userData.name ?? null,
        email: userData.email ?? primaryEmail,
        avatar_url: userData.avatar_url,
        bio: userData.bio ?? null,
        public_repos: userData.public_repos ?? 0,
        followers: userData.followers ?? 0,
        html_url: userData.html_url,
      },
    });

    return res.redirect(`${frontendUrl}/dashboard`);
  } catch (err) {
    console.error("User fetch failed:", err);
    return res.redirect(`${frontendUrl}/login?error=user_fetch_failed`);
  }
});

// ── GET /auth/logout ─────────────────────────────────────────────────────────
router.get("/logout", (req: Request, res: Response) => {
  destroySession(res);
  res.redirect(`${process.env.FRONTEND_URL}/login`);
});

// ── GET /auth/me ─────────────────────────────────────────────────────────────
// Returns the current user's profile — access token never leaves the server
router.get("/me", (req: Request, res: Response) => {
  const session = getSession(req);
  if (!session) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  res.json(session.user);
});

export default router;
