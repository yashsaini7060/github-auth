import { randomBytes } from "crypto";
import type { Request, Response } from "express";

const STATE_COOKIE = "oauth_state";

export function generateState(): string {
  return randomBytes(16).toString("base64url");
}

export function setStateCookie(res: Response, state: string): void {
  res.cookie(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 10 * 60 * 1000, // 10 minutes
    path: "/",
  });
}

export function getStateCookie(req: Request): string | undefined {
  return req.cookies?.[STATE_COOKIE];
}

export function clearStateCookie(res: Response): void {
  res.clearCookie(STATE_COOKIE, { path: "/" });
}
