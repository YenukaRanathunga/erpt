import { clerkClient } from "@clerk/nextjs/server";
import { getSql } from "@/lib/db";
import { createSeedState } from "@/app/seed-state";
import { createEmployeeLoginChallenge, EMP_LOGIN_CHALLENGE_COOKIE, employeeLoginChallengeMaxAge } from "@/lib/internal-auth";

export const runtime = "nodejs";
type User = { id: string; name: string; role: string; active: boolean; empNo?: string; authEmail?: string };
type SharedState = { users: User[] };
const ADMIN_EMPLOYEE_NUMBERS: Record<string, string> = { "255": "USR-007", "116": "USR-012", "197": "USR-013", "209": "USR-014", "159": "USR-015", "178": "USR-016", "195": "USR-017" };

export async function POST(request: Request) {
  try {
    const body = await request.json() as { empNo?: string; email?: string };
    const empNo = String(body.empNo ?? "").replace(/\D/g, "");
    const email = String(body.email ?? "").trim().toLowerCase();
    if (!empNo) return Response.json({ error: "Enter your Employee Number." }, { status: 400 });
    if (!/^[^@\s]+@chrysaliscatalyz\.com$/i.test(email)) return Response.json({ error: "Enter your official @chrysaliscatalyz.com work email." }, { status: 400 });
    const sql = getSql();
    await sql`CREATE TABLE IF NOT EXISTS app_state (id INTEGER PRIMARY KEY, state_json JSONB NOT NULL, revision INTEGER NOT NULL DEFAULT 1, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
    let rows = await sql`SELECT state_json FROM app_state WHERE id = 1 LIMIT 1` as unknown as Array<{ state_json: SharedState }>;
    if (!rows[0]) {
      await sql`INSERT INTO app_state (id, state_json, revision, updated_at) VALUES (1, ${JSON.stringify(createSeedState())}::jsonb, 1, NOW()) ON CONFLICT (id) DO NOTHING`;
      rows = await sql`SELECT state_json FROM app_state WHERE id = 1 LIMIT 1` as unknown as Array<{ state_json: SharedState }>;
    }
    const users = rows[0]?.state_json?.users ?? [];
    const mappedId = ADMIN_EMPLOYEE_NUMBERS[empNo];
    const user = users.find(item => item.id === mappedId) ?? users.find(item => item.empNo === empNo);
    if (!user || !user.active || user.role === "super_admin") return Response.json({ error: "Employee Number not found or this account is disabled." }, { status: 401 });

    await sql`CREATE TABLE IF NOT EXISTS employee_email_identities (
      emp_no TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      clerk_user_id TEXT NOT NULL UNIQUE,
      verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
    const bound = await sql`SELECT email FROM employee_email_identities WHERE emp_no = ${empNo} LIMIT 1` as unknown as Array<{ email: string }>;
    if (bound[0] && bound[0].email.toLowerCase() !== email) return Response.json({ error: "This Employee Number is already linked to another verified work email. Contact the Super Admin." }, { status: 409 });
    const emailOwner = await sql`SELECT emp_no FROM employee_email_identities WHERE LOWER(email) = ${email} LIMIT 1` as unknown as Array<{ emp_no: string }>;
    if (emailOwner[0] && emailOwner[0].emp_no !== empNo) return Response.json({ error: "This work email is already linked to another staff account." }, { status: 409 });
    if (user.authEmail && user.authEmail.toLowerCase() !== email) return Response.json({ error: "Use the work email assigned to this staff profile." }, { status: 403 });

    const client = await clerkClient();
    const existing = await client.users.getUserList({ emailAddress: [email], limit: 1 });
    if (!existing.data[0]) {
      await client.users.createUser({
        emailAddress: [email],
        emailAddressIdentificationStatus: ["reserved"],
        firstName: user.name,
        externalId: `employee-${empNo}`,
        skipPasswordRequirement: true,
      });
    }

    const response = Response.json({ ok: true, name: user.name, email });
    response.headers.append("Set-Cookie", `${EMP_LOGIN_CHALLENGE_COOKIE}=${createEmployeeLoginChallenge({ empNo, email })}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${employeeLoginChallengeMaxAge}; Secure`);
    return response;
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to sign in." }, { status: 500 });
  }
}
