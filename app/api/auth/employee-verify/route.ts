import { auth, currentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { createSeedState } from "@/app/seed-state";
import { getSql } from "@/lib/db";
import {
  createEmployeeSession,
  EMP_LOGIN_CHALLENGE_COOKIE,
  EMP_SESSION_COOKIE,
  employeeSessionMaxAge,
  verifyEmployeeLoginChallenge,
} from "@/lib/internal-auth";

export const runtime = "nodejs";

type User = { id: string; name: string; role: string; active: boolean; empNo?: string };
type SharedState = { users: User[] };
const ADMIN_EMPLOYEE_NUMBERS: Record<string, string> = { "255": "USR-007", "116": "USR-012", "197": "USR-013", "209": "USR-014", "159": "USR-015", "178": "USR-016", "195": "USR-017" };

export async function POST() {
  try {
    const { userId: clerkUserId } = await auth();
    const clerkUser = await currentUser();
    if (!clerkUserId || !clerkUser) return Response.json({ error: "Verify the email code first." }, { status: 401 });
    const verifiedEmail = clerkUser.emailAddresses.find(item => item.id === clerkUser.primaryEmailAddressId)?.emailAddress?.toLowerCase()
      ?? clerkUser.emailAddresses.find(item => item.verification?.status === "verified")?.emailAddress?.toLowerCase();
    const store = await cookies();
    const challenge = verifyEmployeeLoginChallenge(store.get(EMP_LOGIN_CHALLENGE_COOKIE)?.value);
    if (!challenge || !verifiedEmail || verifiedEmail !== challenge.email) return Response.json({ error: "The verified email does not match this login request. Start again." }, { status: 403 });

    const sql = getSql();
    await sql`CREATE TABLE IF NOT EXISTS app_state (id INTEGER PRIMARY KEY, state_json JSONB NOT NULL, revision INTEGER NOT NULL DEFAULT 1, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
    let rows = await sql`SELECT state_json FROM app_state WHERE id = 1 LIMIT 1` as unknown as Array<{ state_json: SharedState }>;
    if (!rows[0]) {
      await sql`INSERT INTO app_state (id, state_json, revision, updated_at) VALUES (1, ${JSON.stringify(createSeedState())}::jsonb, 1, NOW()) ON CONFLICT (id) DO NOTHING`;
      rows = await sql`SELECT state_json FROM app_state WHERE id = 1 LIMIT 1` as unknown as Array<{ state_json: SharedState }>;
    }
    const users = rows[0]?.state_json?.users ?? [];
    const mappedId = ADMIN_EMPLOYEE_NUMBERS[challenge.empNo];
    const user = users.find(item => item.id === mappedId) ?? users.find(item => item.empNo === challenge.empNo);
    if (!user || !user.active || user.role === "super_admin") return Response.json({ error: "This staff account is no longer active." }, { status: 403 });

    await sql`CREATE TABLE IF NOT EXISTS employee_email_identities (
      emp_no TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      clerk_user_id TEXT NOT NULL UNIQUE,
      verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
    const conflict = await sql`SELECT emp_no, email FROM employee_email_identities WHERE emp_no = ${challenge.empNo} OR LOWER(email) = ${challenge.email} OR clerk_user_id = ${clerkUserId}` as unknown as Array<{ emp_no: string; email: string }>;
    if (conflict.some(item => item.emp_no !== challenge.empNo || item.email.toLowerCase() !== challenge.email)) return Response.json({ error: "This verified identity is already linked to another staff account." }, { status: 409 });
    await sql`
      INSERT INTO employee_email_identities (emp_no, user_id, email, clerk_user_id, verified_at, updated_at)
      VALUES (${challenge.empNo}, ${user.id}, ${challenge.email}, ${clerkUserId}, NOW(), NOW())
      ON CONFLICT (emp_no) DO UPDATE SET email = EXCLUDED.email, clerk_user_id = EXCLUDED.clerk_user_id, verified_at = NOW(), updated_at = NOW()
    `;

    const response = Response.json({ ok: true, name: user.name });
    response.headers.append("Set-Cookie", `${EMP_SESSION_COOKIE}=${createEmployeeSession({ userId: user.id, empNo: challenge.empNo, name: user.name })}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${employeeSessionMaxAge}; Secure`);
    response.headers.append("Set-Cookie", `${EMP_LOGIN_CHALLENGE_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Secure`);
    return response;
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to complete verification." }, { status: 500 });
  }
}
