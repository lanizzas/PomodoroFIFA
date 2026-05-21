import { cookies } from "next/headers";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";

const SECRET = process.env.SESSION_SECRET ?? "career-mode-default-secret-change-in-prod";
const COOKIE = "cm_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

export function createToken(userId: string): string {
  const data = Buffer.from(JSON.stringify({ id: userId, ts: Date.now() })).toString("base64url");
  return `${data}.${sign(data)}`;
}

export function verifyToken(token: string): string | null {
  const [data, sig] = token.split(".");
  if (!data || !sig) return null;
  try {
    const expected = sign(data);
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    const { id } = JSON.parse(Buffer.from(data, "base64url").toString());
    return id as string;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function setSessionCookie(userId: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, createToken(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export { randomBytes };
