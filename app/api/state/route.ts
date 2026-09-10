import { auth, currentUser } from "@clerk/nextjs/server";
import { getSql } from "@/lib/db";
import { createSeedState } from "@/app/seed-state";
import { actingAccessForStaff, approvalAccessForStaff, displayRoleForStaff, displayTitleForStaff, legacySampleApproverIds } from "@/app/approval-access";
import { staffMembers } from "@/app/staff-data";
import { currentEmployeeSession, type EmployeeSession } from "@/lib/internal-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROOT_ACCOUNTS: Record<string, string> = {
  "yenukaadarsha93@gmail.com": "Yenuka K.",
  "info@chrysaliscatalyz.com": "Chrysalis Admin",
  "itsupport@chrysaliscatalyz.com": "Chrysalis IT Support",
};
const INDIKA_EMAIL = "indika.fernando@chrysaliscatalyz.com";
const ADMIN_EMPLOYEE_NUMBERS: Record<string, string> = { "USR-007": "255", "USR-012": "116", "USR-013": "197", "USR-014": "209", "USR-015": "159", "USR-016": "178", "USR-017": "195" };
type Role = "user" | "project_manager" | "project_director" | "ceo_assistant" | "hr" | "ceo" | "head_operations" | "admin" | "super_admin";
type User = { id: string; name: string; email: string; authEmail?: string; role: Role; displayRole?: Role; displayTitle?: string; office: string; active: boolean; protected?: boolean; empNo?: string; position?: string; project?: string; actingFor?: string; accessOverride?: boolean };
type Item = Record<string, unknown> & { id: string; person?: string; office?: string; status?: string; awaitingRole?: string; approverNames?: string[]; approverRoles?: string[] };
type RequestMessage = { id: string; author: string; authorRole: string; text: string; sentAt: string };
type DirectConversation = { id: string; participants: string[]; messages: RequestMessage[]; updatedAt: string };
type Vehicle = Record<string, unknown> & { id: string; office?: string };
type SharedState = { requests: Item[]; users: User[]; offices: string[]; vehicles: Vehicle[]; conversations: DirectConversation[] };
type Membership = { name: string; email: string; role: Role; displayRole?: Role; displayTitle?: string; office: string; empNo?: string };
type SqlClient = ReturnType<typeof getSql>;
const APPROVAL_ROLES = new Set<Role>(["project_manager", "project_director", "ceo", "head_operations"]);

function canApproveRequest(item: Item, member: Pick<Membership, "name" | "role" | "office">): boolean {
  if (!APPROVAL_ROLES.has(member.role)) return false;
  if (item.approverNames?.includes(member.name)) return true;
  const roleMatches = item.approverRoles?.includes(member.role) || (item.awaitingRole ?? "project_manager") === member.role;
  return Boolean(roleMatches && (item.office ?? "Head Office") === member.office);
}

const officialEmail = (value: unknown) => typeof value === "string" && /^[^@\s]+@chrysaliscatalyz\.com$/i.test(value.trim()) ? value.trim().toLowerCase() : null;

async function approverEmail(sql: SqlClient, user: User): Promise<string | null> {
  const assigned = officialEmail(user.authEmail) ?? officialEmail(user.email);
  if (assigned) return assigned;
  if (!user.empNo) return null;
  const rows = await sql`SELECT email FROM employee_email_identities WHERE emp_no = ${user.empNo} LIMIT 1` as unknown as Array<{ email: string }>;
  return officialEmail(rows[0]?.email);
}

async function sendApprovalAlerts(sql: SqlClient, state: SharedState, requests: Item[]) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !requests.length) return;
  const from = process.env.RESEND_FROM_EMAIL ?? "Chrysalis Mobility <notifications@chrysaliscatalyz.com>";
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://vercel-share-drab.vercel.app").replace(/\/$/, "");
  for (const request of requests) {
    const approvers = state.users.filter(user => user.active && canApproveRequest(request,user));
    await Promise.all(approvers.map(async approver => {
      const to = await approverEmail(sql, approver);
      if (!to) return;
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": `approval-alert-${request.id}-${approver.id}` },
        body: JSON.stringify({
          from,
          to: [to],
          subject: "New mobility request awaits your approval",
          html: `<!doctype html><html><body style="margin:0;background:#f4f7fa;font-family:Arial,sans-serif;color:#102f4d"><div style="max-width:600px;margin:0 auto;padding:32px 18px"><div style="background:#fff;border:1px solid #d9e2ea;border-radius:12px;overflow:hidden"><div style="padding:22px 26px;background:#082744;color:#fff"><div style="font-size:12px;letter-spacing:1.4px;color:#8fd8ff">CHRYSALIS MOBILITY OPERATIONS</div><h1 style="margin:10px 0 0;font-size:24px">New approval is waiting</h1></div><div style="padding:26px"><p style="margin:0;line-height:1.65">A new vehicle request has been assigned to your approval queue. For privacy, request details are available only inside the secure workspace.</p><a href="${appUrl}" style="display:inline-block;margin-top:24px;padding:13px 20px;border-radius:8px;background:#0f6cbd;color:#fff;text-decoration:none;font-weight:700">Open approval queue</a><p style="margin:22px 0 0;color:#64748b;font-size:12px;line-height:1.5">This is an automatic operational alert. Sign in with your official work account to review the request.</p></div></div></div></body></html>`,
        }),
      });
      if (!response.ok) console.error("Approval email delivery failed", response.status);
    }));
  }
}

function requestFingerprint(item: Item): string {
  return [item.person, item.office, item.route, item.date, item.time, item.requestDate, item.budget, JSON.stringify(item.passengers ?? [])]
    .map(value => String(value ?? "").trim().toLowerCase())
    .join("|");
}

function withoutDuplicateRequests(items: Item[]): Item[] {
  const seen = new Set<string>();
  return items.filter(item => {
    if (item.tripId || item.status === "Completed" || item.status === "Cancelled") return true;
    const key = requestFingerprint(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function appendAuthorizedMessages(current: Item, incoming: Item, member: Membership, allowed: boolean): Item {
  if (!allowed) return current;
  const existing = Array.isArray(current.messages) ? current.messages.filter((message): message is RequestMessage => Boolean(message && typeof message === "object" && "id" in message)) : [];
  const knownIds = new Set(existing.map(message=>message.id));
  const submitted = Array.isArray(incoming.messages) ? incoming.messages : [];
  const additions = submitted.flatMap(message => {
    if (!message || typeof message !== "object") return [];
    const candidate=message as Partial<RequestMessage>;
    if (!candidate.id || knownIds.has(candidate.id) || candidate.author !== member.name || typeof candidate.text !== "string" || !candidate.text.trim()) return [];
    knownIds.add(candidate.id);
    return [{ id:candidate.id, author:member.name, authorRole:String(member.displayTitle ?? member.displayRole ?? member.role), text:candidate.text.trim().slice(0,1000), sentAt:new Date().toISOString() }];
  });
  return additions.length ? { ...current, messages:[...existing,...additions] } : current;
}

function mergeAuthorizedConversations(current: SharedState, incoming: SharedState, member: Membership): DirectConversation[] {
  const validNames = new Set(current.users.filter(user=>user.active).map(user=>user.name));
  const incomingById = new Map(incoming.conversations.map(item=>[item.id,item]));
  const merged = current.conversations.map(conversation=>{
    const next=incomingById.get(conversation.id);
    if (!next || !conversation.participants.includes(member.name)) return conversation;
    const knownIds=new Set(conversation.messages.map(message=>message.id));
    const additions=next.messages.flatMap(message=>{
      if (!message?.id || knownIds.has(message.id) || message.author!==member.name || typeof message.text!=="string" || !message.text.trim()) return [];
      knownIds.add(message.id);
      return [{id:message.id,author:member.name,authorRole:String(member.displayTitle ?? member.displayRole ?? member.role),text:message.text.trim().slice(0,1000),sentAt:new Date().toISOString()}];
    });
    return additions.length ? {...conversation,messages:[...conversation.messages,...additions],updatedAt:new Date().toISOString()} : conversation;
  });
  const knownConversationIds=new Set(current.conversations.map(item=>item.id));
  const additions=incoming.conversations.flatMap(conversation=>{
    const participants=[...new Set(conversation.participants)];
    if (knownConversationIds.has(conversation.id) || participants.length!==2 || !participants.includes(member.name) || !participants.every(name=>validNames.has(name))) return [];
    const firstMessages=conversation.messages.flatMap(message=>message.author===member.name && typeof message.text==="string" && message.text.trim() ? [{id:message.id,author:member.name,authorRole:String(member.displayTitle ?? member.displayRole ?? member.role),text:message.text.trim().slice(0,1000),sentAt:new Date().toISOString()}] : []);
    return [{id:conversation.id,participants,messages:firstMessages,updatedAt:new Date().toISOString()}];
  });
  return [...additions,...merged];
}

function isSharedState(value: unknown): value is SharedState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<SharedState>;
  return Array.isArray(state.requests) && Array.isArray(state.users) && Array.isArray(state.offices) &&
    state.offices.every(item => typeof item === "string") && Array.isArray(state.vehicles) && Array.isArray(state.conversations);
}

function applyApprovalDirectory(state: SharedState): { state: SharedState; changed: boolean } {
  const staffByEmpNo = new Map(staffMembers.map(staff => [staff.empNo, staff]));
  let changed = false;
  if (!Array.isArray(state.conversations)) {
    state = { ...state, conversations: [] };
    changed = true;
  }
  const users = state.users.flatMap(user => {
    if (legacySampleApproverIds.has(user.id)) {
      changed = true;
      return [];
    }
    const adminEmpNo = ADMIN_EMPLOYEE_NUMBERS[user.id];
    if (adminEmpNo && user.empNo !== adminEmpNo) {
      changed = true;
      user = { ...user, empNo: adminEmpNo };
    }
    if (user.id === "USR-007" && user.authEmail !== INDIKA_EMAIL) {
      changed = true;
      return [{ ...user, authEmail: INDIKA_EMAIL, role: "admin" as Role, office: "Head Office", active: true }];
    }
    const staff = user.role === "admin" ? undefined : user.empNo ? staffByEmpNo.get(user.empNo) : undefined;
    if (!staff) {
      if (user.id === "USR-011" && !user.authEmail && user.email !== "Login email to be assigned") {
        changed = true;
        return [{ ...user, email: "Login email to be assigned", role: "head_operations" as Role, active: true }];
      }
      return [user];
    }
    const role = user.accessOverride ? user.role : approvalAccessForStaff(staff) as Role;
    const displayRole = user.accessOverride ? user.role : displayRoleForStaff(staff) as Role;
    const displayTitle = user.accessOverride ? undefined : displayTitleForStaff(staff);
    const actingFor = user.accessOverride ? undefined : actingAccessForStaff(staff);
    if (user.role === role && user.displayRole === displayRole && user.displayTitle === displayTitle && user.position === staff.position && user.project === staff.project && user.actingFor === actingFor) return [user];
    changed = true;
    return [{ ...user, role, displayRole, displayTitle, position: staff.position, project: staff.project, actingFor }];
  });
  if (!users.some(user => user.role === "head_operations")) {
    users.push({ id: "USR-011", name: "Head of Operations", email: "Login email to be assigned", role: "head_operations", office: "Head Office", active: true });
    changed = true;
  }
  const infoRoot = users.find(user => user.id === "USR-ROOT-INFO");
  if (!infoRoot) {
    users.push({ id: "USR-ROOT-INFO", name: "Chrysalis Admin", email: "info@chrysaliscatalyz.com", authEmail: "info@chrysaliscatalyz.com", role: "super_admin", office: "Head Office", active: true, protected: true });
    changed = true;
  } else if (infoRoot.authEmail !== "info@chrysaliscatalyz.com" || infoRoot.role !== "super_admin" || !infoRoot.active) {
    Object.assign(infoRoot,{ name:"Chrysalis Admin", email:"info@chrysaliscatalyz.com", authEmail:"info@chrysaliscatalyz.com", role:"super_admin" as Role, office:"Head Office", active:true, protected:true });
    changed = true;
  }
  const itRoot = users.find(user => user.id === "USR-ROOT-IT");
  if (!itRoot) {
    users.push({ id: "USR-ROOT-IT", name: "Chrysalis IT Support", email: "itsupport@chrysaliscatalyz.com", authEmail: "itsupport@chrysaliscatalyz.com", role: "super_admin", office: "Head Office", active: true, protected: true });
    changed = true;
  } else if (itRoot.authEmail !== "itsupport@chrysaliscatalyz.com" || itRoot.role !== "super_admin" || !itRoot.active) {
    Object.assign(itRoot,{ name:"Chrysalis IT Support", email:"itsupport@chrysaliscatalyz.com", authEmail:"itsupport@chrysaliscatalyz.com", role:"super_admin" as Role, office:"Head Office", active:true, protected:true });
    changed = true;
  }
  return { state: changed ? { ...state, users } : state, changed };
}

function membershipFor(email: string, state: SharedState | null): Membership | null {
  const normalizedEmail = email.toLowerCase();
  const rootName = ROOT_ACCOUNTS[normalizedEmail];
  if (rootName) return { name: rootName, email, role: "super_admin", office: "Head Office" };
  let user = state?.users.find(item => item.active && (
    (item.authEmail ?? item.email).toLowerCase() === normalizedEmail ||
    (item.empNo === "260" && normalizedEmail === "imalka.aththanagoda@chrysaliscatalyz.com")
  ));
  const [localPart, domain] = normalizedEmail.split("@");
  if (!user && domain === "chrysaliscatalyz.com" && state) {
    const tokens = localPart.split(/[._-]+/).filter(token => token.length >= 3);
    const matches = state.users.filter(item => {
      const normalizedName = item.name.toLowerCase();
      return item.active && item.role === "user" && tokens.length >= 2 && tokens.every(token => normalizedName.includes(token));
    });
    if (matches.length === 1) user = matches[0];
  }
  return user ? { name: user.name, email, role: user.role, displayRole: user.displayRole ?? user.role, displayTitle: user.displayTitle, office: user.office, empNo: user.empNo } : null;
}

function membershipForEmployee(session: EmployeeSession, state: SharedState | null): Membership | null {
  const user = state?.users.find(item => item.id === session.userId && item.active && item.empNo === session.empNo);
  return user ? { name: user.name, email: `EMP No: ${session.empNo}`, role: user.role, displayRole: user.displayRole ?? user.role, displayTitle: user.displayTitle, office: user.office, empNo: session.empNo } : null;
}

function visibleState(state: SharedState, member: Membership): SharedState {
  if (member.role === "super_admin") return { ...state, requests: withoutDuplicateRequests(state.requests) };
  const officeMatches = (item: { office?: string }) => member.office === "Head Office" || (item.office ?? "Head Office") === member.office;
  const operational = (status: string) => ["Approved", "Trip scheduled", "Completed"].includes(status);
  const visibleRequests = member.role === "admin"
    ? state.requests.filter(officeMatches)
    : member.role === "user"
      ? state.requests.filter(item => item.person === member.name || operational(item.status ?? ""))
      : state.requests.filter(item => item.person === member.name || canApproveRequest(item,member) || operational(item.status ?? ""));
  const requests = withoutDuplicateRequests(visibleRequests);
  const users = state.users.filter(item=>item.active).map(({authEmail: _authEmail,...user})=>user);
  const vehicles = member.role === "admin" ? state.vehicles.filter(officeMatches) : [];
  const conversations = state.conversations.filter(item=>item.participants.includes(member.name));
  return { requests, users, offices: state.offices, vehicles, conversations };
}

function mergeAuthorized(current: SharedState, incoming: SharedState, member: Membership): SharedState {
  const conversations=mergeAuthorizedConversations(current,incoming,member);
  if (member.role === "super_admin") return { ...incoming, conversations };
  const officeMatches = (item: { office?: string }) => member.office === "Head Office" || (item.office ?? "Head Office") === member.office;
  const incomingById = new Map(incoming.requests.map(item => [item.id, item]));
  let requests = current.requests.map(item => {
    const next = incomingById.get(item.id);
    if (!next) return item;
    if (member.role === "admin" && officeMatches(item)) return next;
    const passengerNames = Array.isArray(item.passengers) ? item.passengers.filter(name=>typeof name === "string") : [];
    const canMessage = item.person === member.name || passengerNames.includes(member.name) || canApproveRequest(item,member);
    const withMessages = appendAuthorizedMessages(item,next,member,Boolean(canMessage));
    if (item.person === member.name && next.status === "Cancelled" && !item.dispatchedAt && !["Trip scheduled", "Completed", "Cancelled"].includes(item.status ?? "")) {
      return { ...withMessages, status: "Cancelled", tone: "red", cancelledAt: next.cancelledAt, cancelledBy: member.name, cancellationReason: next.cancellationReason };
    }
    if (canApproveRequest(item,member)) {
      return { ...withMessages, status: next.status, tone: next.tone, approvedBy: next.approvedBy, approvedAt: next.approvedAt, decisionComment: next.decisionComment, decisionBy: next.decisionBy, decisionAt: next.decisionAt };
    }
    return withMessages;
  });
  const existingIds = new Set(current.requests.map(item => item.id));
  const knownFingerprints = new Set(current.requests.map(requestFingerprint));
  const genuinelyNew = incoming.requests
    .filter(item => !existingIds.has(item.id) && item.person === member.name)
    .map(item => ({ ...item, office: member.office }))
    .filter(item => { const key=requestFingerprint(item); if(knownFingerprints.has(key)) return false; knownFingerprints.add(key); return true; });
  requests = [...genuinelyNew, ...requests];
  let vehicles = current.vehicles;
  if (member.role === "admin") {
    const incomingVehicles = new Map(incoming.vehicles.map(item => [item.id, item]));
    vehicles = current.vehicles.map(item => officeMatches(item) && incomingVehicles.has(item.id) ? incomingVehicles.get(item.id)! : item);
    const vehicleIds = new Set(current.vehicles.map(item => item.id));
    vehicles = [...incoming.vehicles.filter(item => !vehicleIds.has(item.id) && officeMatches(item)), ...vehicles];
  }
  return { ...current, requests, vehicles, conversations };
}

const userEmailCache = new Map<string, { email: string | null; expires: number }>();

async function viewerIdentity() {
  const employee = await currentEmployeeSession();
  if (employee) return { employee, email: null };
  const { userId, sessionClaims } = await auth();
  if (!userId) return { employee: null, email: null };

  const now = Date.now();
  const cached = userEmailCache.get(userId);
  if (cached && cached.expires > now) {
    return { employee: null, email: cached.email };
  }

  const claims = sessionClaims as Record<string, unknown> | null;
  const claimsEmail = typeof claims?.email === "string" ? claims.email : typeof claims?.primary_email === "string" ? claims.primary_email : null;
  if (claimsEmail && claimsEmail.includes("@")) {
    userEmailCache.set(userId, { email: claimsEmail, expires: now + 5 * 60 * 1000 });
    return { employee: null, email: claimsEmail };
  }

  try {
    const user = await currentUser();
    const email = user?.emailAddresses.find(item => item.id === user.primaryEmailAddressId)?.emailAddress ?? user?.emailAddresses[0]?.emailAddress ?? null;
    userEmailCache.set(userId, { email, expires: now + 5 * 60 * 1000 });
    return { employee: null, email };
  } catch (error) {
    console.error("Clerk user identity lookup error:", error);
    if (cached) return { employee: null, email: cached.email };
    return { employee: null, email: null };
  }
}

async function readState() {
  const sql = getSql();
  await sql`CREATE TABLE IF NOT EXISTS app_state (
    id INTEGER PRIMARY KEY,
    state_json JSONB NOT NULL,
    revision INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  let rows = await sql`SELECT state_json, revision FROM app_state WHERE id = 1 LIMIT 1` as unknown as Array<{ state_json: SharedState; revision: number }>;
  if (!rows[0]) {
    const seed = createSeedState() as SharedState;
    await sql`INSERT INTO app_state (id, state_json, revision, updated_at) VALUES (1, ${JSON.stringify(seed)}::jsonb, 1, NOW()) ON CONFLICT (id) DO NOTHING`;
    rows = await sql`SELECT state_json, revision FROM app_state WHERE id = 1 LIMIT 1` as unknown as Array<{ state_json: SharedState; revision: number }>;
  }
  let row = rows[0];
  if (row?.state_json) {
    const upgraded = applyApprovalDirectory(row.state_json);
    if (upgraded.changed) {
      const saved = await sql`
        UPDATE app_state SET state_json = ${JSON.stringify(upgraded.state)}::jsonb,
          revision = revision + 1, updated_at = NOW()
        WHERE id = 1 RETURNING state_json, revision
      ` as unknown as Array<{ state_json: SharedState; revision: number }>;
      row = saved[0];
    }
  }
  return { sql, row, state: row?.state_json ?? null };
}

export async function GET() {
  const viewer = await viewerIdentity();
  if (!viewer.email && !viewer.employee) return Response.json({ error: "Sign in required" }, { status: 401 });
  try {
    const { row, state } = await readState();
    const membership = viewer.employee ? membershipForEmployee(viewer.employee, state) : membershipFor(viewer.email!, state);
    if (!membership) return Response.json({ error: "Your email has not been assigned access by the Super Admin." }, { status: 403 });
    return Response.json({ state: state ? visibleState(state, membership) : null, revision: row?.revision ?? 0, membership });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load shared workspace" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const viewer = await viewerIdentity();
  if (!viewer.email && !viewer.employee) return Response.json({ error: "Sign in required" }, { status: 401 });
  try {
    const payload = (await request.json()) as { state?: unknown };
    if (!isSharedState(payload.state)) return Response.json({ error: "Invalid shared workspace data" }, { status: 400 });
    const { sql, row, state } = await readState();
    const membership = viewer.employee ? membershipForEmployee(viewer.employee, state) : membershipFor(viewer.email!, state);
    if (!membership) return Response.json({ error: "Access has not been assigned." }, { status: 403 });
    if (!state && membership.role !== "super_admin") return Response.json({ error: "Only the Super Admin can initialize the workspace." }, { status: 403 });
    const nextState = state ? mergeAuthorized(state, payload.state, membership) : payload.state;
    const existingRequestIds = new Set(state?.requests.map(item => item.id) ?? []);
    const approvalAlerts = nextState.requests.filter(item => !existingRequestIds.has(item.id) && item.person === membership.name && item.status === "Awaiting approval");
    const saved = await sql`
      INSERT INTO app_state (id, state_json, revision, updated_at)
      VALUES (1, ${JSON.stringify(nextState)}::jsonb, 1, NOW())
      ON CONFLICT (id) DO UPDATE SET
        state_json = EXCLUDED.state_json,
        revision = app_state.revision + 1,
        updated_at = NOW()
      RETURNING revision
    ` as unknown as Array<{ revision: number }>;
    await sendApprovalAlerts(sql, nextState, approvalAlerts).catch(error => console.error("Unable to send approval alerts", error));
    return Response.json({
      revision: Number(saved[0]?.revision ?? 1),
      state: visibleState(nextState, membership),
      membership,
      previousRevision: row?.revision ?? 0,
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to save shared workspace" }, { status: 500 });
  }
}
