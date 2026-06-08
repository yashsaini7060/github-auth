import { createHmac, timingSafeEqual } from "crypto";
import { Request, Response } from "express";

const SESSION_COOKIE = "gh_oauth_session";
const MAX_AGE_SECONDS = 60 * 60 * 24; // 24 hours

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

export interface SessionData {
  accessToken: string;
  user: UserProfile;
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function verify(payload: string, signature: string, secret: string): boolean {
  const expected = sign(payload, secret);
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function createSession(res: Response, data: SessionData): void {
  const secret = process.env.SESSION_SECRET!;
  const payload = Buffer.from(JSON.stringify(data)).toString("base64url");
  const signature = sign(payload, secret);
  const cookie = `${payload}.${signature}`;

  res.cookie(SESSION_COOKIE, cookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE_SECONDS * 1000, // express uses ms
    path: "/",
  });
}

export function getSession(req: Request): SessionData | null {
  const secret = process.env.SESSION_SECRET!;
  const raw = req.cookies?.[SESSION_COOKIE];
  if (!raw) return null;

  const lastDot = raw.lastIndexOf(".");
  if (lastDot === -1) return null;

  const payload = raw.slice(0, lastDot);
  const signature = raw.slice(lastDot + 1);

  if (!verify(payload, signature, secret)) return null;

  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString()) as SessionData;
  } catch {
    return null;
  }
}

export function destroySession(res: Response): void {
  res.clearCookie(SESSION_COOKIE, { path: "/" });
}
