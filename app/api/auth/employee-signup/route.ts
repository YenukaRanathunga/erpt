import { clerkClient } from "@clerk/nextjs/server";
import { getSql } from "@/lib/db";
import { createSeedState } from "@/app/seed-state";
import { createEmployeeLoginChallenge, EMP_LOGIN_CHALLENGE_COOKIE, employeeLoginChallengeMaxAge } from "@/lib/internal-auth";

export const runtime = "nodejs";
type User = { id: string; name: string; email?: string; role: string; active: boolean; empNo?: string; authEmail?: string; office?: string; position?: string };
type SharedState = { users: User[] };

export async function POST(request: Request) {
  try {
    const body = await request.json() as { empNo?: string; email?: string; name?: string };
    const empNo = String(body.empNo ?? "").replace(/\D/g, "");
    const email = String(body.email ?? "").trim().toLowerCase();
    const name = String(body.name ?? "").trim();
    if (!name || name.length < 2) return Response.json({ error: "Enter your full name." }, { status: 400 });
    if (!empNo) return Response.json({ error: "Enter your Employee Number." }, { status: 400 });
    if (!email || !email.includes("@")) return Response.json({ error: "Enter a valid work email address." }, { status: 400 });

    const sql = getSql();
    await sql`CREATE TABLE IF NOT EXISTS app_state (id INTEGER PRIMARY KEY, state_json JSONB NOT NULL, revision INTEGER NOT NULL DEFAULT 1, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
    let rows = await sql`SELECT state_json FROM app_state WHERE id = 1 LIMIT 1` as unknown as Array<{ state_json: SharedState }>;
    if (!rows[0]) {
      await sql`INSERT INTO app_state (id, state_json, revision, updated_at) VALUES (1, ${JSON.stringify(createSeedState())}::jsonb, 1, NOW()) ON CONFLICT (id) DO NOTHING`;
      rows = await sql`SELECT state_json FROM app_state WHERE id = 1 LIMIT 1` as unknown as Array<{ state_json: SharedState }>;
    }
    const state = rows[0]?.state_json;
    const users = state?.users ?? [];

    /* Check if this EMP number or email already exists */
    const existingByEmp = users.find(item => item.empNo === empNo || item.id === `EMP-${empNo}`);
    if (existingByEmp) {
      /* If already exists AND active, tell them to sign in instead */
      if (existingByEmp.active) return Response.json({ error: "This Employee Number already has an account. Use Sign in instead." }, { status: 409 });
      return Response.json({ error: "This Employee Number is disabled. Contact the Super Admin." }, { status: 403 });
    }
    const existingByEmail = users.find(item => (item.authEmail ?? "").toLowerCase() === email || (item.email ?? "").toLowerCase() === email);
    if (existingByEmail) return Response.json({ error: "This email is already linked to another staff account." }, { status: 409 });

    /* Create the new user profile in the database */
    const newUserId = `EMP-${empNo}`;
    const newUser: User = {
      id: newUserId,
      name,
      email: `EMP No: ${empNo}`,
      authEmail: email,
      role: "user",
      office: "Head Office",
      active: true,
      empNo,
      position: "Staff Member",
    };
    const updatedUsers = [...users, newUser];
    const updatedState = { ...state, users: updatedUsers };
    await sql`UPDATE app_state SET state_json = ${JSON.stringify(updatedState)}::jsonb, revision = revision + 1, updated_at = NOW() WHERE id = 1`;

    /* Create or find the Clerk user for OTP */
    await sql`CREATE TABLE IF NOT EXISTS employee_email_identities (
      emp_no TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      clerk_user_id TEXT NOT NULL UNIQUE,
      verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;

    const client = await clerkClient();
    const existing = await client.users.getUserList({ emailAddress: [email], limit: 1 });
    let clerkUserId: string;
    if (!existing.data[0]) {
      const created = await client.users.createUser({
        emailAddress: [email],
        emailAddressIdentificationStatus: ["reserved"],
        firstName: name,
        externalId: `employee-${empNo}`,
        skipPasswordRequirement: true,
      });
      clerkUserId = created.id;
    } else {
      clerkUserId = existing.data[0].id;
    }

    const response = Response.json({ ok: true, name, email });
    response.headers.append("Set-Cookie", `${EMP_LOGIN_CHALLENGE_COOKIE}=${createEmployeeLoginChallenge({ empNo, email })}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${employeeLoginChallengeMaxAge}; Secure`);
    return response;
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to create account." }, { status: 500 });
  }
}
