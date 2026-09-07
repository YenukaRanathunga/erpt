import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const EMP_SESSION_COOKIE = "chrysalis_emp_session_v2";
export const LEGACY_EMP_SESSION_COOKIE = "chrysalis_emp_session";
export const EMP_LOGIN_CHALLENGE_COOKIE = "chrysalis_emp_login_challenge";
const SESSION_SECONDS = 60 * 60 * 24 * 180;
const CHALLENGE_SECONDS = 60 * 10;

export type EmployeeSession = { userId: string; empNo: string; name: string; exp: number };
export type EmployeeLoginChallenge = { empNo: string; email: string; exp: number };

function secret() {
  const value = process.env.EMP_SESSION_SECRET || process.env.CLERK_SECRET_KEY;
  if (!value) throw new Error("Employee login session secret is not configured.");
  return value;
}

function signature(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createEmployeeSession(input: Omit<EmployeeSession, "exp">) {
  const payload = Buffer.from(JSON.stringify({ ...input, exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS })).toString("base64url");
  return `${payload}.${signature(payload)}`;
}

export function createEmployeeLoginChallenge(input: Omit<EmployeeLoginChallenge, "exp">) {
  const payload = Buffer.from(JSON.stringify({ ...input, exp: Math.floor(Date.now() / 1000) + CHALLENGE_SECONDS })).toString("base64url");
  return `${payload}.${signature(payload)}`;
}

export function verifyEmployeeSession(token?: string | null): EmployeeSession | null {
  if (!token) return null;
  const [payload, provided] = token.split(".");
  if (!payload || !provided) return null;
  try {
    const expected = signature(payload);
    const providedBuffer = Buffer.from(provided);
    const expectedBuffer = Buffer.from(expected);
    if (providedBuffer.length !== expectedBuffer.length || !timingSafeEqual(providedBuffer, expectedBuffer)) return null;
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as EmployeeSession;
    if (!session.userId || !session.empNo || !session.name || session.exp <= Math.floor(Date.now() / 1000)) return null;
    return session;
  } catch { return null; }
}

export function verifyEmployeeLoginChallenge(token?: string | null): EmployeeLoginChallenge | null {
  if (!token) return null;
  const [payload, provided] = token.split(".");
  if (!payload || !provided) return null;
  try {
    const expected = signature(payload);
    const providedBuffer = Buffer.from(provided);
    const expectedBuffer = Buffer.from(expected);
    if (providedBuffer.length !== expectedBuffer.length || !timingSafeEqual(providedBuffer, expectedBuffer)) return null;
    const challenge = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as EmployeeLoginChallenge;
    if (!challenge.empNo || !challenge.email || challenge.exp <= Math.floor(Date.now() / 1000)) return null;
    return challenge;
  } catch { return null; }
}

export async function currentEmployeeSession() {
  const store = await cookies();
  return verifyEmployeeSession(store.get(EMP_SESSION_COOKIE)?.value);
}

export const employeeSessionMaxAge = SESSION_SECONDS;
export const employeeLoginChallengeMaxAge = CHALLENGE_SECONDS;
