"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { staffMembers, type StaffMember } from "./staff-data";
import { approvalAccessForStaff, displayRoleForStaff, displayTitleForStaff } from "./approval-access";
import { downloadHiringVehicleRegister, type HiringVehicleRegisterRow } from "./report-xlsx";
import HelpGuideModal from "./help-guide-modal";

type View = "dashboard" | "calendar" | "request" | "approvals" | "trips" | "vehicles" | "reports" | "chat" | "settings";
type Role = "user" | "project_manager" | "project_director" | "ceo_assistant" | "hr" | "ceo" | "head_operations" | "admin" | "super_admin";
type ApprovalRole = "project_manager" | "project_director" | "ceo" | "head_operations";
type NotificationItem = { id: string; title: string; detail: string; view: View; tone: "amber" | "blue" | "green" | "red" };
type AdminTab = "people" | "routing" | "requests";
type VehicleStatus = "Available" | "Out of service";
type VehicleRecord = { id: string; registration: string; model: string; company?: string; type: string; seats: number; office: string; fuel: string; status: VehicleStatus };
type TripIncident = {
  id: string;
  recordedAt: string;
  recordedBy: string;
  location: string;
  issue: string;
  originalVehicle: string;
  originalDriver: string;
  replacementVehicle: string;
  replacementDriver: string;
  actionTaken: string;
};
type RequestMessage = {
  id: string;
  author: string;
  authorRole: string;
  text: string;
  sentAt: string;
};
type DirectConversation = {
  id: string;
  participants: string[];
  messages: RequestMessage[];
  updatedAt: string;
};
type RequestItem = {
  id: string;
  person: string;
  route: string;
  date: string;
  time: string;
  status: string;
  tone: string;
  budget: string;
  purpose?: string;
  office?: string;
  requestDate?: string;
  requestType?: string;
  returnDate?: string;
  returnTime?: string;
  stops?: string[];
  passengers?: string[];
  externalPassengers?: string[];
  requesterEmpNo?: string;
  requesterPosition?: string;
  requesterProject?: string;
  approvedBy?: string;
  approvedAt?: string;
  tripId?: string;
  vehicle?: string;
  vehicleCompany?: string;
  vehicleType?: string;
  driver?: string;
  dispatchedAt?: string;
  pickupInstructions?: string;
  adminNotes?: string;
  incidents?: TripIncident[];
  mileageKm?: number;
  tripCostLkr?: number;
  highwayCostLkr?: number;
  perDiemCostLkr?: number;
  otherCostLkr?: number;
  finalPriceLkr?: number;
  completedAt?: string;
  completedBy?: string;
  receiptRef?: string;
  completionNotes?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;
  createdByRole?: Role;
  awaitingRole?: ApprovalRole;
  approverNames?: string[];
  approverRoles?: ApprovalRole[];
  decisionComment?: string;
  decisionBy?: string;
  decisionAt?: string;
  messages?: RequestMessage[];
};
type UserRecord = {
  id: string;
  name: string;
  email: string;
  role: Role;
  displayRole?: Role;
  displayTitle?: string;
  office: string;
  active: boolean;
  protected?: boolean;
  empNo?: string;
  position?: string;
  project?: string;
  authEmail?: string;
  actingFor?: string;
  accessOverride?: boolean;
};
type SharedState = { requests: RequestItem[]; users: UserRecord[]; offices: string[]; vehicles: VehicleRecord[]; conversations: DirectConversation[] };
type Membership = { name: string; email: string; role: Role; displayRole?: Role; displayTitle?: string; office: string; empNo?: string };
type SyncStatus = "connecting" | "synced" | "saving" | "offline";

const roleConfig: Record<Role, {
  label: string;
  description: string;
  email: string;
  name: string;
  initials: string;
  startView: View;
  views: View[];
}> = {
  user: {
    label: "Staff User",
    description: "Sign in with Employee No and create requests",
    email: "lasantha@chrysalis.lk",
    name: "Lasantha Soysa",
    initials: "LS",
    startView: "calendar",
    views: ["calendar", "request"],
  },
  project_manager: {
    label: "Project Manager / Area Approver",
    description: "Project Managers, Area Managers and Senior Project Coordinators",
    email: "nadeesha@chrysalis.lk",
    name: "Nadeesha Fernando",
    initials: "NF",
    startView: "approvals",
    views: ["calendar", "request", "approvals"],
  },
  project_director: {
    label: "Project Director",
    description: "Programme Director and acting Project Director approval",
    email: "ruwan@chrysalis.lk",
    name: "Dr. Ruwan Silva",
    initials: "RS",
    startView: "approvals",
    views: ["calendar", "request", "approvals"],
  },
  ceo_assistant: {
    label: "Executive Coordinator",
    description: "Create executive office travel requests",
    email: "executive.coordinator@chrysalis.lk",
    name: "Executive Coordinator",
    initials: "EC",
    startView: "calendar",
    views: ["calendar", "request"],
  },
  hr: {
    label: "HR",
    description: "Create and follow people operations requests",
    email: "hr@chrysalis.lk",
    name: "HR Officer",
    initials: "HR",
    startView: "calendar",
    views: ["calendar", "request"],
  },
  ceo: {
    label: "CEO",
    description: "CEO and delegated CEO-level approval",
    email: "ceo@chrysalis.lk",
    name: "Chief Executive Officer",
    initials: "CE",
    startView: "approvals",
    views: ["calendar", "request", "approvals"],
  },
  head_operations: {
    label: "Head of Operations",
    description: "Approve HR and Colombo Admin requests",
    email: "head.operations@chrysalis.lk",
    name: "Head of Operations",
    initials: "HO",
    startView: "approvals",
    views: ["calendar", "request", "approvals"],
  },
  admin: {
    label: "Admin",
    description: "Plan, merge and complete trips",
    email: "indika.fernando@chrysalis.lk",
    name: "Indika Fernando",
    initials: "IF",
    startView: "trips",
    views: ["dashboard", "calendar", "request", "trips", "vehicles", "reports"],
  },
  super_admin: {
    label: "Super Admin",
    description: "Full system and access control",
    email: "yenuka@chrysalis.lk",
    name: "Yenuka K.",
    initials: "YK",
    startView: "dashboard",
    views: ["dashboard", "calendar", "request", "trips", "vehicles", "reports", "settings"],
  },
};
const navItems: { id: View; label: string; short: string }[] = [
  { id: "dashboard", label: "Operations", short: "OP" },
  { id: "calendar", label: "Trip calendar", short: "CL" },
  { id: "request", label: "New request", short: "NR" },
  { id: "approvals", label: "Approvals", short: "AP" },
  { id: "trips", label: "Trip planning", short: "TP" },
  { id: "vehicles", label: "Service providers", short: "SP" },
  { id: "reports", label: "Reports", short: "RP" },
  { id: "settings", label: "Administration", short: "AD" },
];
const initialRequests: RequestItem[] = [
  { id: "VR-260814-042", person: "Lasantha Soysa", route: "Colombo → Badulla", date: "17 Aug", time: "06:30", status: "Awaiting approval", tone: "amber", budget: "COPEJW602162", office: "Head Office", createdByRole: "user", awaitingRole: "project_manager" },
  { id: "VR-260814-041", person: "Keerthi Indrajith", route: "Colombo → Badulla", date: "17 Aug", time: "07:00", status: "Approved", tone: "green", budget: "HRD-2026-118", office: "Head Office" },
  { id: "VR-260814-039", person: "Thirumarugan R.", route: "Batticaloa → Kandy", date: "16 Aug", time: "08:30", status: "Needs revision", tone: "red", budget: "OPS-26-771", office: "Batticaloa Area Office" },
  { id: "VR-260813-036", person: "Amali Perera", route: "Galle → Matara", date: "16 Aug", time: "09:00", status: "Trip scheduled", tone: "blue", budget: "FIELD-26-041", office: "Galle Area Office" },
];
const staffUserRecords: UserRecord[] = staffMembers.map(staff => ({
  id: `EMP-${staff.empNo}`,
  name: staff.name,
  email: `EMP No: ${staff.empNo}`,
  authEmail: staff.empNo === "260" ? "imalka.aththanagoda@chrysaliscatalyz.com" : undefined,
  role: approvalAccessForStaff(staff),
  displayRole: displayRoleForStaff(staff),
  displayTitle: displayTitleForStaff(staff),
  office: staff.office,
  active: true,
  empNo: staff.empNo,
  position: staff.position,
  project: staff.project,
  actingFor: undefined,
}));
const initialUsers: UserRecord[] = [
  ...staffUserRecords,
  { id: "USR-001", name: "Yenuka K.", email: "yenuka@chrysalis.lk", authEmail: "yenukaadarsha93@gmail.com", role: "super_admin", office: "Head Office", active: true, protected: true },
  { id: "USR-ROOT-INFO", name: "Chrysalis Admin", email: "info@chrysaliscatalyz.com", authEmail: "info@chrysaliscatalyz.com", role: "super_admin", office: "Head Office", active: true, protected: true },
  { id: "USR-ROOT-IT", name: "Chrysalis IT Support", email: "itsupport@chrysaliscatalyz.com", authEmail: "itsupport@chrysaliscatalyz.com", role: "super_admin", office: "Head Office", active: true, protected: true },
  { id: "USR-007", name: "Indika Fernando", email: "indika.fernando@chrysalis.lk", authEmail: "indika.fernando@chrysaliscatalyz.com", role: "admin", office: "Head Office", active: true },
  { id: "USR-011", name: "Head of Operations", email: "Login email to be assigned", role: "head_operations", office: "Head Office", active: true },
  { id: "USR-012", name: "Iruthayarajah Rohan", email: "iruthayarajah.rohan@chrysalis.lk", role: "admin", office: "Kilinochchi Area Office", active: true },
  { id: "USR-013", name: "Jayani Udakumbura", email: "jayani.udakumbura@chrysalis.lk", role: "admin", office: "Kandy Area Office", active: true },
  { id: "USR-014", name: "Ishara Dharmasiri", email: "ishara.dharmasiri@chrysalis.lk", role: "admin", office: "Badulla Area Office", active: true },
  { id: "USR-015", name: "Mufli Mohamed", email: "mufli.mohamed@chrysalis.lk", role: "admin", office: "Puttalam Area Office", active: true },
  { id: "USR-016", name: "Anita Amily", email: "anita.amily@chrysalis.lk", role: "admin", office: "Batticaloa Area Office", active: true },
  { id: "USR-017", name: "Sarath Kumara", email: "sarath.kumara@chrysalis.lk", role: "admin", office: "Matara Area Office", active: true },
];
const initialOffices = [...new Set(["Head Office","Galle Area Office", ...staffMembers.map(staff => staff.office)])];
const initialVehicles: VehicleRecord[] = [
  { id:"VEH-001", registration:"Chrysalis Transport Partner", company:"Chrysalis Transport Partner", model:"Transport Partner", type:"Company", seats:0, office:"Head Office", fuel:"—", status:"Available" },
  { id:"VEH-002", registration:"Kangaroo Cabs", company:"Kangaroo Cabs", model:"Cabs & Vans", type:"Company", seats:0, office:"Head Office", fuel:"—", status:"Available" },
  { id:"VEH-003", registration:"Southern Transport Service", company:"Southern Transport Service", model:"Vans & Buses", type:"Company", seats:0, office:"Matara Area Office", fuel:"—", status:"Available" },
  { id:"VEH-004", registration:"Malkey Rent-a-Car", company:"Malkey Rent-a-Car", model:"Fleet Partner", type:"Company", seats:0, office:"Head Office", fuel:"—", status:"Available" },
];
const vehicleLabel = (vehicle: VehicleRecord) => vehicle.company || vehicle.registration;
const loginRoles: Role[] = ["user", "project_manager", "project_director", "ceo", "head_operations", "admin", "super_admin"];
const editableRoles: Role[] = ["user", "project_manager", "project_director", "ceo", "head_operations", "admin", "super_admin"];
const requestStatuses = ["Draft", "Awaiting approval", "Approved", "Needs revision", "Trip scheduled", "Completed", "Cancelled"];
const toneForStatus = (status: string) => status === "Approved" || status === "Completed" ? "green" : status === "Needs revision" || status === "Cancelled" ? "red" : status === "Trip scheduled" ? "blue" : "amber";
const officeForRequest = (item: RequestItem) => item.office ?? (item.id === "VR-260814-039" ? "Batticaloa Area Office" : item.id === "VR-260813-036" ? "Galle Area Office" : "Head Office");
const approvalRoles = new Set<Role>(["project_manager", "project_director", "ceo", "head_operations"]);
const canApproveRequest = (item: RequestItem, role: Role, accountName: string, accountOffice: string) => {
  if (!approvalRoles.has(role)) return false;
  if (item.approverNames?.includes(accountName)) return true;
  const roleMatches = item.approverRoles?.includes(role as ApprovalRole) || (item.awaitingRole ?? "project_manager") === role;
  return Boolean(roleMatches && officeForRequest(item) === accountOffice);
};
const approvalRoleFor = (requesterRole: Role, office: string): ApprovalRole => requesterRole === "project_manager" ? "project_director" : requesterRole === "project_director" || requesterRole === "head_operations" ? "ceo" : requesterRole === "admin" && office === "Head Office" ? "head_operations" : "project_manager";
const notificationsFor = (role: Role, accountName: string, accountOffice: string, requests: RequestItem[]): NotificationItem[] => {
  if ((["project_manager", "project_director", "ceo", "head_operations"] as Role[]).includes(role)) {
    return requests.filter(item => item.status === "Awaiting approval" && canApproveRequest(item,role,accountName,accountOffice)).map(item => ({ id: `${role}:${item.id}:${item.status}`, title: `${item.id} needs your approval`, detail: `${item.person} · ${item.route} · ${item.date} at ${item.time}`, view: "approvals", tone: "amber" }));
  }
  if (role === "admin") {
    return requests.filter(item => (accountOffice === "Head Office" || officeForRequest(item) === accountOffice) && (item.status === "Approved" || item.status === "Trip scheduled")).map(item => ({ id: `${role}:${accountOffice}:${item.id}:${item.status}`, title: item.status === "Approved" ? `${item.id} is ready for trip planning` : `${item.id} is scheduled`, detail: `${item.person} · ${item.route} · ${officeForRequest(item)}`, view: "trips", tone: item.status === "Approved" ? "green" : "blue" }));
  }
  if (role === "super_admin") {
    return requests.filter(item => item.status === "Approved" || item.status === "Trip scheduled").map(item => ({ id: `${role}:${item.id}:${item.status}`, title: item.status === "Approved" ? `${item.id} is ready for trip planning` : `${item.id} is scheduled`, detail: `${item.person} · ${item.route} · ${officeForRequest(item)}`, view: "trips", tone: item.status === "Approved" ? "green" : "blue" }));
  }
  return requests.filter(item => item.person === accountName && ["Needs revision", "Approved", "Trip scheduled", "Completed"].includes(item.status)).map(item => ({ id: `${role}:${item.id}:${item.status}`, title: `${item.id} · ${item.status}`, detail: `${item.route} · ${item.date} at ${item.time}`, view: "calendar", tone: item.status === "Needs revision" ? "red" : item.status === "Approved" || item.status === "Completed" ? "green" : "blue" }));
};
const announce = (message: string) => window.dispatchEvent(new CustomEvent("chrysalis:notice", { detail: message }));
const downloadCsv = (filename: string, rows: string[][]) => {
  const csv = rows.map(row => row.map(value => `"${String(value).replaceAll('"','""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
  const link = document.createElement("a"); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url);
};
const parseReportDate = (value?: string) => {
  if (!value) return null;
  const clean = value.trim();
  const iso = clean.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  const numeric = clean.match(/^(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{4}))?$/);
  if (numeric) return new Date(Number(numeric[3] ?? 2026), Number(numeric[2]) - 1, Number(numeric[1]));
  const parsed = new Date(/\b\d{4}\b/.test(clean) ? clean : `${clean} 2026`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};
const reportRouteParts = (item: RequestItem) => {
  const parts = item.route.split(/\s*→\s*/).map(part => part.trim()).filter(Boolean);
  if (parts.length > 1) return { from: parts[0], to: parts.slice(1).join(" → ") };
  const stops = (item.stops ?? []).map(stop => stop.trim()).filter(Boolean);
  return { from: parts[0] ?? officeForRequest(item), to: stops.length ? stops.join(" → ") : item.route };
};

function Login({ onLogin, offices, admins, staff }: { onLogin: (role: Role, adminOffice?: string, staffMember?: StaffMember) => void; offices: string[]; admins: UserRecord[]; staff: StaffMember[] }) {
  const [role, setRole] = useState<Role>("user");
  const [email, setEmail] = useState(roleConfig.user.email);
  const [showPassword, setShowPassword] = useState(false);
  const [adminOffice, setAdminOffice] = useState("Head Office");
  const [employeeNo, setEmployeeNo] = useState("");
  const selected = roleConfig[role];
  const adminForOffice = (office: string) => admins.find(admin => admin.office === office && admin.active);
  const selectedStaff = staff.find(member => member.empNo === employeeNo.trim());

  const chooseRole = (nextRole: Role) => {
    setRole(nextRole);
    setEmail(nextRole === "admin" ? adminForOffice(adminOffice)?.email ?? roleConfig.admin.email : roleConfig[nextRole].email);
  };
  const chooseAdminOffice = (office: string) => { setAdminOffice(office); setEmail(adminForOffice(office)?.email ?? roleConfig.admin.email); };
  const submitLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (role === "user") {
      if (!selectedStaff) { announce("Employee number not found. Check the staff list number and try again."); return; }
      onLogin(role, adminOffice, selectedStaff);
      return;
    }
    onLogin(role, adminOffice);
  };

  return <main className="login-page">
    <section className="login-story">
      <div className="login-brand"><img className="official-logo" src="/chrysalis-official.png" alt="Chrysalis — Catalyzing change"/></div>
      <div className="login-message"><p className="eyebrow">TRANSPORT OPERATIONS PLATFORM</p><h1>Every request.<br/>One clear journey.</h1><p>Plan, approve and coordinate staff travel through one controlled operational workflow.</p></div>
      <div className="login-flow"><div><b>01</b><span><strong>Request</strong><small>Journey and budget</small></span></div><i/><div><b>02</b><span><strong>Approve</strong><small>Role-based control</small></span></div><i/><div><b>03</b><span><strong>Operate</strong><small>Merge and complete</small></span></div></div>
    </section>
    <section className="login-panel-wrap">
      <form className="login-card" onSubmit={submitLogin}>
        <div className="login-heading"><p className="eyebrow">SECURE ACCESS</p><h2>Welcome back</h2><p>Select your account type and sign in to continue.</p></div>
        <fieldset className="role-selector"><legend>Account type</legend>{loginRoles.map((item) => <button type="button" key={item} className={role === item ? "selected" : ""} onClick={() => chooseRole(item)}><span>{roleConfig[item].initials}</span><span><strong>{roleConfig[item].label}</strong><small>{roleConfig[item].description}</small></span><i>{role === item ? "✓" : ""}</i></button>)}</fieldset>
        {role === "admin" && <label className="login-field"><span>Admin office · scope preview</span><select value={adminOffice} onChange={event => chooseAdminOffice(event.target.value)}>{offices.map(office=><option key={office}>{office}</option>)}</select><small className="scope-helper">Head Office (Colombo) can view all offices. Area Admins are restricted to their own office.</small></label>}
        {role === "user" ? <label className="login-field"><span>Employee number</span><div><i>#</i><input inputMode="numeric" value={employeeNo} onChange={(event) => setEmployeeNo(event.target.value.replace(/\D/g,""))} placeholder="Enter EMP No" required /></div>{selectedStaff && <small className="scope-helper">{selectedStaff.name} · {selectedStaff.position} · {selectedStaff.office}</small>}</label> : <>
          <label className="login-field"><span>Work email</span><div><i>@</i><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div></label>
          <label className="login-field"><span>Password</span><div><i>•</i><input type={showPassword ? "text" : "password"} defaultValue="Chrysalis2026" required /><button type="button" onClick={() => setShowPassword(value => !value)}>{showPassword ? "Hide" : "Show"}</button></div></label>
        </>}
        {role !== "user" && <div className="login-options"><label><input type="checkbox" defaultChecked /> Keep me signed in</label><button type="button" onClick={() => announce("Password reset instructions sent to the selected work email.")}>Forgot password?</button></div>}
        <button className="primary login-submit" type="submit">{role === "user" ? "Sign in with Employee No" : `Sign in as ${selected.label}`} <span>→</span></button>
        <div className="demo-note"><span>i</span><p><strong>Prototype access</strong> — choose any role to preview its permitted workspace. Live accounts will be assigned by Super Admin.</p></div>
      </form>
      <p className="login-footer">Chrysalis · Internal mobility management · Version 1.1</p>
    </section>
  </main>;
}

function Status({ tone, children }: { tone: string; children: React.ReactNode }) { return <span className={`status ${tone}`}><span />{children}</span>; }
function PageTitle({ eyebrow, title, subtitle, action }: { eyebrow: string; title: string; subtitle: string; action?: React.ReactNode }) {
  return <div className="page-title"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="subtitle">{subtitle}</p></div>{action}</div>;
}

function Dashboard({ onNew, onNavigate, requests }: { onNew: () => void; onNavigate: (view: View) => void; requests: RequestItem[] }) {
  return <>
    <PageTitle eyebrow="Friday · 14 August 2026" title="Good morning, Yenuka" subtitle="Here is today’s transport operations picture across all offices." action={<button className="primary" onClick={onNew}><span>＋</span> Create request</button>} />
    <section className="metric-grid" aria-label="Operations summary">
      <article className="metric-card accent"><div className="metric-head"><span>Open requests</span><b>Live</b></div><strong>{requests.filter(item => item.status !== "Trip scheduled").length}</strong><p>{requests.length} requests in the local register</p><div className="spark"><i /><i /><i /><i /><i /><i /><i /></div></article>
      <article className="metric-card"><div className="metric-head"><span>Pending approvals</span><b className="warning">Needs action</b></div><strong>{requests.filter(item => item.status === "Awaiting approval").length}</strong><p>Updates immediately after a decision</p><div className="mini-progress"><span style={{ width: "64%" }} /></div></article>
      <article className="metric-card"><div className="metric-head"><span>Trips today</span><b className="calm">On track</b></div><strong>18</strong><p>15 scheduled · 3 completed</p><div className="mini-progress blue"><span style={{ width: "82%" }} /></div></article>
      <article className="metric-card"><div className="metric-head"><span>Merge opportunities</span><b className="saving">Save 3 trips</b></div><strong>4</strong><p>Requests with matching routes</p><div className="route-dots"><i /><span /><i /><span /><i /></div></article>
    </section>
    <section className="dashboard-grid">
      <article className="panel requests-panel"><div className="panel-head"><div><h2>Request control</h2><p>Live queue across every approval stage</p></div><button className="text-button" onClick={() => onNavigate("approvals")}>View all <span>→</span></button></div><div className="table-scroll"><table><thead><tr><th>Request</th><th>Route</th><th>Travel</th><th>Status</th><th /></tr></thead><tbody>{requests.map(item => <tr key={item.id}><td><strong>{item.id}</strong><small>{item.person}</small></td><td className="request-route">{item.route}<small>{item.budget}</small></td><td><strong>{item.date}</strong><small>{item.time}</small></td><td><Status tone={item.tone}>{item.status}</Status></td><td><button className="more" aria-label={`Open ${item.id}`} onClick={() => { onNavigate("approvals"); announce(`${item.id} opened in the approval queue.`); }}>•••</button></td></tr>)}</tbody></table></div></article>
      <aside className="panel timeline-panel"><div className="panel-head"><div><h2>Today’s movement</h2><p>Next departures</p></div><span className="live"><i /> LIVE</span></div><div className="timeline"><div className="timeline-item now"><time>12:30</time><div><strong>Head Office → Kandy</strong><p>Trip TR-1082 · 4 passengers</p><span>Driver assigned</span></div></div><div className="timeline-item"><time>14:00</time><div><strong>Head Office → Negombo</strong><p>Trip TR-1084 · 2 passengers</p><span>Vehicle confirmed</span></div></div><div className="timeline-item"><time>15:15</time><div><strong>Galle Office → Matara</strong><p>Trip TR-1085 · 5 passengers</p><span>Awaiting dispatch</span></div></div></div><button className="secondary wide" onClick={() => onNavigate("trips")}>Open dispatch board</button></aside>
    </section>
    <section className="lower-grid"><article className="panel alert-panel"><div className="alert-icon">!</div><div><p className="eyebrow">ACTION REQUIRED</p><h3>3 requests break the 3-day notice rule</h3><p>Review the business justification before approval.</p></div><button className="secondary" onClick={() => onNavigate("approvals")}>Review now</button></article><article className="panel coverage-panel"><div><p className="eyebrow">WEEKLY COMPLETION</p><h3>Operations coverage</h3></div><div className="coverage-value"><strong>92%</strong><span>+4.8% vs last week</span></div></article></section>
  </>;
}

function RequestForm({ requester, requesterRole, requesterOffice, requesterDetails, approvers, offices, onCreate }: { requester: string; requesterRole: Role; requesterOffice: string; requesterDetails?: StaffMember | null; approvers: UserRecord[]; offices: string[]; onCreate: (request: RequestItem) => void }) {
  const [requestType, setRequestType] = useState("Field"); const [codes, setCodes] = useState(["COPEJW602162"]); const [holders, setHolders] = useState<string[]>([]); const [approverSearch,setApproverSearch] = useState(""); const [submitted, setSubmitted] = useState(false);
  const submittingRef = useRef(false);
  const [office, setOffice] = useState(requesterOffice);
  const chrBudgetRoute = codes.some(code => code.trim().toUpperCase().startsWith("CHR"));
  const directorRoute = requesterRole === "project_director" || /\bdirector\b/i.test(requesterDetails?.position ?? "");
  const hodRoute = requesterRole === "head_operations" || /\b(head of|hod)\b/i.test(requesterDetails?.position ?? "");
  const approvalRole: ApprovalRole = chrBudgetRoute || directorRoute || hodRoute ? "ceo" : approvalRoleFor(requesterRole, office);
  const eligibleApprovers = useMemo(() => {
    const query = approverSearch.trim().toLowerCase();
    const rank: Record<ApprovalRole,number> = { project_manager: 1, project_director: 2, head_operations: 3, ceo: 4 };
    return approvers
      .filter(approver => (["project_manager","project_director","head_operations","ceo"] as Role[]).includes(approver.role))
      .filter(approver => !query || `${approver.name} ${approver.position ?? ""} ${approver.project ?? ""} ${approver.office} ${roleConfig[approver.role].label}`.toLowerCase().includes(query))
      .sort((a,b) => rank[a.role as ApprovalRole] - rank[b.role as ApprovalRole] || a.name.localeCompare(b.name));
  },[approvers,approverSearch]);
  const approvalRoute = chrBudgetRoute ? "CHR budget request → CEO → Admin" : directorRoute ? "Project Director → CEO → Admin" : hodRoute ? "HOD request → CEO → Admin" : requesterRole === "admin" && office === "Head Office" ? "Colombo Admin → Head of Operations → Admin operations" : requesterRole === "project_manager" ? "Project Manager → Project Director → Admin" : `Requester → ${roleConfig[approvalRole].label} → Admin`;
  const [origin, setOrigin] = useState("Colombo Head Office"); const [destination, setDestination] = useState("Badulla"); const [stops,setStops] = useState<string[]>([]); const [requestDate,setRequestDate] = useState(new Date().toISOString().slice(0,10)); const [travelDate, setTravelDate] = useState("2026-08-17"); const [departure, setDeparture] = useState("06:30"); const [returnDate,setReturnDate] = useState("2026-08-17"); const [returnTime,setReturnTime] = useState("19:00"); const [purpose, setPurpose] = useState("Procurement-related works and staff capacity building");
  const [passengers,setPassengers] = useState([requester]);
  const [externalPassengers,setExternalPassengers] = useState<string[]>([]);
  const [otherPassengerName,setOtherPassengerName] = useState("");
  const [passengerPickerOpen,setPassengerPickerOpen] = useState(false);
  const [passengerSearch,setPassengerSearch] = useState("");
  const availablePassengers = useMemo(() => {
    const query = passengerSearch.trim().toLowerCase();
    return staffMembers
      .filter(staff => !passengers.includes(staff.name))
      .filter(staff => !query || `${staff.name} ${staff.empNo} ${staff.position} ${staff.project} ${staff.office}`.toLowerCase().includes(query))
      .sort((a,b) => Number(b.office === office) - Number(a.office === office) || a.name.localeCompare(b.name))
      .slice(0,30);
  },[passengerSearch,passengers,office]);
  const toggleHolder = (name: string) => setHolders(items => items.includes(name) ? items.filter(item => item !== name) : [...items, name]);
  const selectPassenger = (staff: StaffMember) => {
    setPassengers(items => items.includes(staff.name) ? items : [...items,staff.name]);
    setPassengerSearch("");
    announce(`${staff.name} added as a passenger.`);
  };
  const addOtherPassenger = () => {
    const name = otherPassengerName.trim();
    if (!name) { announce("Enter the outside passenger or consultant name."); return; }
    if (passengers.some(item => item.toLowerCase() === name.toLowerCase())) { announce(`${name} is already on this request.`); return; }
    setPassengers(items => [...items,name]);
    setExternalPassengers(items => [...items,name]);
    setOtherPassengerName("");
    announce(`${name} added as an other passenger / consultant.`);
  };
  const routePlaces = [origin.replace(" Head Office", ""), ...stops.map(stop=>stop.trim()).filter(Boolean), destination.trim()].filter(Boolean);
  const routeLabel = routePlaces.join(" → ");
  const saveDraft = () => { window.localStorage.setItem("chrysalis-request-draft",JSON.stringify({requestType,office,origin,destination,stops,travelDate,departure,purpose,codes,holders,passengers,externalPassengers})); announce("Request draft saved on this device."); };
  const submitRequest = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingRef.current) { announce("This request is already being submitted."); return; }
    if (!holders.length) { announce("Select at least one budget holder or approver."); return; }
    submittingRef.current = true;
    const parsedDate = new Date(`${travelDate}T00:00:00`);
    const date = Number.isNaN(parsedDate.getTime()) ? travelDate : parsedDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
    const dateParts = travelDate.split("-");
    const day = dateParts[2] ?? "01";
    const month = dateParts[1] ?? "01";
    const year = (dateParts[0] ?? "2026").slice(-2);
    const dateCode = `${day}${month}${year}`;
    const suffix = String(Date.now()).slice(-3);
    const selectedApprovers = approvers.filter(approver => holders.includes(approver.name));
    const selectedRoles = [...new Set(selectedApprovers.map(approver => approver.role as ApprovalRole))];
    onCreate({ id: `VR-${dateCode}-${suffix}`, person: requester, route: routeLabel, stops: stops.map(stop=>stop.trim()).filter(Boolean), date, time: departure, status: "Awaiting approval", tone: "amber", budget: codes.find(Boolean) ?? "Unassigned", purpose, office, requestDate, requestType, returnDate, returnTime, passengers, externalPassengers, requesterEmpNo: requesterDetails?.empNo, requesterPosition: requesterDetails?.position, requesterProject: requesterDetails?.project, createdByRole: requesterRole, awaitingRole: selectedRoles[0] ?? approvalRole, approverNames: holders, approverRoles: selectedRoles });
    setSubmitted(true);
  };
  return <><PageTitle eyebrow="VEHICLE REQUISITION" title="Create a new request" subtitle="Complete the journey details, budget codes and responsible approvers." action={<span className="draft-state">Saved as draft · just now</span>} />
    <div className="form-layout"><form className="request-form" onSubmit={submitRequest}>
      <section className="form-section"><div className="section-number">01</div><div className="section-copy"><h2>Request details</h2><p>Basic information about the requesting office.</p></div><div className="field-grid"><label><span>Base office *</span><select value={office} onChange={event => setOffice(event.target.value)}>{offices.map(item=><option key={item}>{item}</option>)}</select></label><label><span>Request date</span><input type="date" value={requestDate} onChange={event=>setRequestDate(event.target.value)} /></label><fieldset className="full"><legend>Nature of request *</legend><div className="segmented">{["Town","Field","Inter Office","Other"].map(type => <button type="button" key={type} className={requestType === type ? "active" : ""} onClick={() => setRequestType(type)}>{type}</button>)}</div></fieldset></div></section>
      <section className="form-section"><div className="section-number">02</div><div className="section-copy"><h2>Journey</h2><p>Add every location in the order the vehicle must visit.</p></div><div className="field-grid four"><label><span>From date *</span><input type="date" value={travelDate} onChange={event => setTravelDate(event.target.value)} required /></label><label><span>Departure *</span><input type="time" value={departure} onChange={event => setDeparture(event.target.value)} required /></label><label><span>To date *</span><input type="date" value={returnDate} onChange={event=>setReturnDate(event.target.value)} required /></label><label><span>Return *</span><input type="time" value={returnTime} onChange={event=>setReturnTime(event.target.value)} required /></label><div className="multi-stop-route full"><label><span>From *</span><div className="input-with-dot route-origin"><i /><input value={origin} onChange={event => setOrigin(event.target.value)} required /></div></label>{stops.map((stop,index)=><label className="stop-field" key={index}><span>Stop {index+1}</span><div className="input-with-dot route-stop"><i /><input value={stop} onChange={event=>setStops(items=>items.map((item,itemIndex)=>itemIndex===index?event.target.value:item))} placeholder="Enter another location" required /><button type="button" aria-label={`Remove stop ${index+1}`} onClick={()=>setStops(items=>items.filter((_,itemIndex)=>itemIndex!==index))}>×</button></div></label>)}<button type="button" className="add-stop-button" onClick={()=>setStops(items=>[...items,""])}>＋ Add another stop</button><label><span>Final destination *</span><div className="input-with-dot destination"><i /><input value={destination} onChange={event => setDestination(event.target.value)} required /></div></label><div className="route-preview"><span>Route preview</span><strong>{routeLabel}</strong></div></div><label className="full"><span>Purpose *</span><textarea value={purpose} onChange={event => setPurpose(event.target.value)} required /></label></div></section>
      <section className="form-section"><div className="section-number">03</div><div className="section-copy"><h2>Passengers</h2><p>Add staff, consultants or any other outside traveller.</p></div>{passengers.map((name,index)=><div className="passenger-row" key={name}><div className={`avatar ${index % 2 ? "blue" : "pink"}`}>{name.split(" ").map(word=>word[0]).slice(0,2).join("")}</div><div><strong>{name}</strong><p>{index===0?"Primary requester":externalPassengers.includes(name)?"Other passenger / Consultant":"Staff passenger"}</p></div>{index===0?<span className="tag">Primary</span>:<button type="button" className="remove" aria-label={`Remove ${name}`} onClick={()=>{setPassengers(items=>items.filter(item=>item!==name));setExternalPassengers(items=>items.filter(item=>item!==name));}}>×</button>}</div>)}<div className="passenger-picker"><button type="button" className="add-row" aria-expanded={passengerPickerOpen} onClick={()=>setPassengerPickerOpen(open=>!open)}>＋ Add passenger</button>{passengerPickerOpen && <div className="passenger-picker-menu"><div className="passenger-search"><span>⌕</span><input autoFocus value={passengerSearch} onChange={event=>setPassengerSearch(event.target.value)} placeholder="Search staff name, EMP no, position or office" aria-label="Search staff passengers" /><button type="button" aria-label="Close passenger search" onClick={()=>{setPassengerPickerOpen(false);setPassengerSearch("");}}>×</button></div><div className="passenger-options">{availablePassengers.length ? availablePassengers.map(staff=><button type="button" key={staff.empNo} onClick={()=>selectPassenger(staff)}><span className="avatar tiny blue">{staff.name.split(" ").map(word=>word[0]).slice(0,2).join("")}</span><span><strong>{staff.name}</strong><small>EMP {staff.empNo} · {staff.position}</small><small>{staff.office}</small></span><b>＋ Add</b></button>) : <p>No matching staff members found.</p>}</div><div className="other-passenger-add"><div><strong>Other passenger</strong><small>Consultant or person outside the staff directory</small></div><div><input value={otherPassengerName} onChange={event=>setOtherPassengerName(event.target.value)} placeholder="Enter full name" aria-label="Other passenger full name" onKeyDown={event=>{if(event.key==="Enter"){event.preventDefault();addOtherPassenger();}}}/><button type="button" onClick={addOtherPassenger}>＋ Add</button></div></div><footer><span>{availablePassengers.length} staff result{availablePassengers.length===1?"":"s"} shown</span><button type="button" onClick={()=>setPassengerPickerOpen(false)}>Done</button></footer></div>}</div></section>
      <section className="form-section budget-section"><div className="section-number">04</div><div className="section-copy"><h2>Budget & approval</h2><p>Enter the current budget code and search the full approval directory.</p></div><div className="budget-grid"><div><p className="block-label">Budget code *</p>{codes.map((code,index) => <div className="code-row" key={index}><span>{String(index+1).padStart(2,"0")}</span><input aria-label={`Budget code ${index + 1}`} value={code} placeholder="Enter budget code" onChange={e => setCodes(items => items.map((item,i) => i === index ? e.target.value : item))} />{codes.length > 1 && <button type="button" aria-label={`Remove budget code ${index + 1}`} onClick={() => setCodes(items => items.filter((_,i) => i !== index))}>×</button>}</div>)}<button type="button" className="add-row" onClick={() => setCodes(items => [...items,""])}>＋ Add another budget code</button></div><div><p className="block-label">Budget holder / approver(s) *</p><label className="approver-search"><span>⌕</span><input value={approverSearch} onChange={event=>setApproverSearch(event.target.value)} placeholder="Search name, position, project, office or role" aria-label="Search budget holders and approvers" /></label><div className="approver-result-count"><span>{eligibleApprovers.length} people</span><small>Managers · Directors · Head of Operations · CEO</small></div><div className="holder-list searchable">{eligibleApprovers.length ? eligibleApprovers.map((approver) => <button type="button" key={approver.id} className={holders.includes(approver.name) ? "selected" : ""} onClick={() => toggleHolder(approver.name)}><span className="avatar tiny">{approver.name.split(" ").map(word => word[0]).slice(0,2).join("")}</span><span><strong>{approver.name}</strong><small>{approver.actingFor ? `Acting ${approver.actingFor}` : approver.position ?? roleConfig[approver.role].label}</small><small>{roleConfig[approver.role].label} · {approver.office}</small></span><i>{holders.includes(approver.name) ? "✓" : ""}</i></button>) : <p className="holder-empty">No matching approvers found.</p>}</div><p className="helper">Selected people receive this request in their own approval queue. {approvalRoute}.</p></div></div>{holders.length > 1 && <div className="director-rule"><span>↗</span><div><strong>Multi-holder approval activated</strong><p>All selected approvers can see this request in their personal queue.</p></div></div>}</section>
      {submitted && <div className="success-banner"><span>✓</span><div><strong>Request saved to the shared register</strong><p>It has been sent to {holders.join(", ")}.</p></div></div>}<div className="form-actions"><button type="button" className="secondary" onClick={saveDraft}>Save draft</button><button type="submit" className="primary" disabled={submitted}>{submitted?"Request submitted":"Submit request"} <span>{submitted?"✓":"→"}</span></button></div>
    </form><aside className="summary-card"><p className="eyebrow">REQUEST SUMMARY</p><h3>{routeLabel}</h3><div className="journey-line multi">{routePlaces.map((place,index)=><span className="journey-point" key={`${place}-${index}`} title={place}><i /><small>{place}</small>{index<routePlaces.length-1&&<b />}</span>)}</div><dl><div><dt>Travel date</dt><dd>{travelDate}</dd></div><div><dt>Stops</dt><dd>{stops.filter(stop=>stop.trim()).length}</dd></div><div><dt>Passengers</dt><dd>{passengers.length} people</dd></div><div><dt>Budget codes</dt><dd>{codes.filter(Boolean).length}</dd></div><div><dt>Approvers</dt><dd>{holders.length} holder{holders.length === 1 ? "" : "s"}</dd></div></dl><div className="approval-path"><p>Approval path</p><div><span className="avatar tiny pink">LS</span><i /><span className="avatar tiny">BH</span>{holders.length > 1 && <><i /><span className="avatar tiny dark">PD</span></>}<i /><span className="avatar tiny blue">AA</span></div><small>Requestor → Budget Holder{holders.length > 1 ? " → Director" : ""} → Area Admin</small></div></aside></div>
  </>;
}

function Approvals({ requests, role, accountName, accountOffice, onStatus }: { requests: RequestItem[]; role: Role; accountName: string; accountOffice: string; onStatus: (id: string, status: string, tone: string, comment?: string) => void }) {
  const [filter,setFilter] = useState<"pending"|"revision"|"approved"|"rejected"|"all">("pending");
  const [detailId,setDetailId] = useState("");
  const assignedRequests = role === "super_admin" ? [] : requests.filter(item => canApproveRequest(item,role,accountName,accountOffice));
  const filtered = assignedRequests.filter(item => filter === "all" || (filter === "pending" ? item.status === "Awaiting approval" : filter === "revision" ? item.status === "Needs revision" : filter === "approved" ? item.status === "Approved" : item.status === "Rejected"));
  const detail = assignedRequests.find(item=>item.id===detailId);
  const requestChanges = (item: RequestItem) => { const comment=window.prompt("Describe the changes required from the requester:",item.decisionComment ?? ""); if(comment===null)return; onStatus(item.id,"Needs revision","red",comment.trim() || "Please revise the request details and resubmit."); setFilter("revision"); };
  const reject = (item: RequestItem) => { const comment=window.prompt("Reason for rejecting this request:",item.decisionComment ?? ""); if(comment===null)return; onStatus(item.id,"Rejected","red",comment.trim() || "Request rejected by the approver."); setFilter("rejected"); };
  const approve = (item: RequestItem) => { onStatus(item.id,"Approved","green","Approved after reviewing the full request details."); setFilter("approved"); };
  return <><PageTitle eyebrow="MY WORKSPACE" title="Approval queue" subtitle="Review vehicle requests assigned to you and keep operations moving." action={<div className="filter-group approval-filters"><button className={`filter ${filter === "pending" ? "active" : ""}`} onClick={()=>setFilter("pending")}>Pending <b>{assignedRequests.filter(item=>item.status==="Awaiting approval").length}</b></button><button className={`filter ${filter === "revision" ? "active" : ""}`} onClick={()=>setFilter("revision")}>Revision</button><button className={`filter ${filter === "approved" ? "active" : ""}`} onClick={()=>setFilter("approved")}>Approved</button><button className={`filter ${filter === "rejected" ? "active" : ""}`} onClick={()=>setFilter("rejected")}>Rejected</button><button className={`filter ${filter === "all" ? "active" : ""}`} onClick={()=>setFilter("all")}>All</button></div>} /><div className="approval-layout"><section className="approval-list">{filtered.length ? filtered.map((item,index) => <article className={`approval-card ${index === 0 ? "featured" : ""}`} key={item.id}><div className="approval-top"><div><Status tone={item.tone}>{item.status}</Status><h2>{item.route}</h2><p>{item.id} · Requested by {item.person}</p></div><div className="date-box"><strong>{item.date.split(" ")[0]}</strong><span>{item.date.split(" ")[1]?.toUpperCase() ?? "TRIP"}</span></div></div><div className="approval-facts"><div><span>Departure</span><strong>{item.date} · {item.time}</strong></div><div><span>Passengers</span><strong>{item.passengers?.length ?? 1} people</strong></div><div><span>Budget code</span><strong>{item.budget}</strong></div></div><p className="purpose">“{item.purpose ?? "Procurement-related works and staff capacity building across the regional programme."}”</p>{item.decisionComment&&<p className="decision-comment"><strong>Decision note:</strong> {item.decisionComment}</p>}<div className="card-actions"><button className="secondary" onClick={()=>setDetailId(item.id)}>View full details</button>{item.status === "Awaiting approval" ? <><button className="secondary" onClick={()=>requestChanges(item)}>Request changes</button><button className="reject-request" onClick={()=>reject(item)}>Reject request</button><button className="approve" onClick={()=>approve(item)}>✓ Approve request</button></> : <Status tone={item.tone}>{item.status}</Status>}</div></article>) : <article className="panel empty-state"><h2>No requests here</h2><p>Decisions and new submissions will appear automatically.</p></article>}</section><aside className="panel approval-guide"><p className="eyebrow">APPROVAL STANDARD</p><h3>Before you approve</h3>{["Journey has a clear business purpose","Budget code is valid for this activity","Passenger list is complete","Notice period or exception is acceptable"].map(text => <p className="check" key={text}><span>✓</span>{text}</p>)}<hr/><small>Your decision, date and any comment is retained in the shared approval history.</small></aside></div>
  {detail&&<div className="approval-detail-backdrop" role="dialog" aria-modal="true" aria-label={`Full details for ${detail.id}`} onMouseDown={event=>{if(event.target===event.currentTarget)setDetailId("")}}><section className="approval-detail-dialog"><header><div><p className="eyebrow">FULL REQUEST DETAILS</p><h2>{detail.route}</h2><span>{detail.id} · {detail.status}</span></div><button aria-label="Close request details" onClick={()=>setDetailId("")}>×</button></header><div className="approval-detail-grid"><div><span>Requester</span><strong>{detail.person}</strong></div><div><span>Employee number</span><strong>{detail.requesterEmpNo ?? "Not recorded"}</strong></div><div><span>Position</span><strong>{detail.requesterPosition ?? "Not recorded"}</strong></div><div><span>Project / programme</span><strong>{detail.requesterProject ?? "Not recorded"}</strong></div><div><span>Base office</span><strong>{detail.office ?? "Head Office"}</strong></div><div><span>Request date</span><strong>{detail.requestDate ?? "Not recorded"}</strong></div><div><span>Request type</span><strong>{detail.requestType ?? "Not recorded"}</strong></div><div><span>Travel date & departure</span><strong>{detail.date} · {detail.time}</strong></div><div><span>Return date & time</span><strong>{detail.returnDate ?? detail.date} · {detail.returnTime ?? "Not recorded"}</strong></div><div><span>Budget code</span><strong>{detail.budget}</strong></div><div className="wide"><span>Purpose</span><strong>{detail.purpose ?? "Not recorded"}</strong></div><div className="wide"><span>Passengers ({detail.passengers?.length ?? 1})</span><strong>{detail.passengers?.join(", ") || detail.person}</strong></div><div className="wide"><span>Selected approver(s)</span><strong>{detail.approverNames?.join(", ") || "Role-based approval queue"}</strong></div>{detail.decisionComment&&<div className="wide decision"><span>Latest decision note</span><strong>{detail.decisionComment}</strong><small>{detail.decisionBy} · {detail.decisionAt ? new Date(detail.decisionAt).toLocaleString() : ""}</small></div>}</div><footer><button className="secondary" onClick={()=>setDetailId("")}>Close</button>{detail.status==="Awaiting approval"&&<><button className="secondary" onClick={()=>{setDetailId("");requestChanges(detail)}}>Request changes</button><button className="reject-request" onClick={()=>{setDetailId("");reject(detail)}}>Reject request</button><button className="approve" onClick={()=>{setDetailId("");approve(detail)}}>✓ Approve request</button></>}</footer></section></div>}</>;
}

function TripPlanning({ requests, vehicles, adminName, onUpdateRequest, onUpdateVehicle }: { requests: RequestItem[]; vehicles: VehicleRecord[]; adminName: string; onUpdateRequest: (id: string, patch: Partial<RequestItem>) => void; onUpdateVehicle: (id: string, patch: Partial<VehicleRecord>) => void }) {
  const candidates = requests.filter(item => item.status === "Approved").slice(0,6);
  const activeTrips = Array.from(new Map(requests.filter(item => item.status === "Trip scheduled").map(item => [item.tripId ?? item.id,item])).values());
  const [selected,setSelected] = useState<string[]>([]);
  const [focusedId,setFocusedId] = useState(candidates[0]?.id ?? "");
  const [vehicle,setVehicle] = useState("");
  const [vehicleType,setVehicleType] = useState("");
  const [driver,setDriver] = useState("");
  const [adminNotes,setAdminNotes] = useState("");
  const [merged,setMerged] = useState(false);
  const [standaloneMode,setStandaloneMode] = useState(false);
  const [mileage,setMileage] = useState("");
  const [finalPrice,setFinalPrice] = useState("");
  const [highwayCost,setHighwayCost] = useState("");
  const [perDiemCost,setPerDiemCost] = useState("");
  const [otherCost,setOtherCost] = useState("");
  const [completedAt,setCompletedAt] = useState("2026-08-17");
  const [receiptRef,setReceiptRef] = useState("");
  const [completionNotes,setCompletionNotes] = useState("");
  const [closed,setClosed] = useState(false);
  const [incidentOpen,setIncidentOpen] = useState(false);
  const [incidentAt,setIncidentAt] = useState(new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16));
  const [incidentLocation,setIncidentLocation] = useState("");
  const [incidentIssue,setIncidentIssue] = useState("");
  const [replacementVehicle,setReplacementVehicle] = useState("");
  const [replacementDriver,setReplacementDriver] = useState("");
  const [incidentAction,setIncidentAction] = useState("");
  const [newPassenger,setNewPassenger] = useState("");
  const focused = requests.find(item => item.id === focusedId) ?? candidates[0] ?? activeTrips[0];
  const replacementVehicles = vehicles.filter(item=>item.status === "Available");
  const availableCompanies = useMemo(() => {
    const active = vehicles
      .filter(item => item.status === "Available")
      .map(item => (item.company || item.registration).trim())
      .filter(Boolean);
    const combined = vehicle && !active.includes(vehicle) ? [vehicle, ...active] : active;
    return Array.from(new Set(combined));
  }, [vehicles, vehicle]);
  const passengerNames = (item: RequestItem) => item.passengers?.length ? item.passengers : [item.person];
  const passengerCount = (id: string) => { const request=requests.find(item=>item.id===id); return request ? passengerNames(request).length : 0; };
  const totalPassengers = selected.reduce((total,id) => total + passengerCount(id),0);
  const tripTotal = Number(finalPrice) + Number(highwayCost) + Number(perDiemCost) + Number(otherCost);
  const canCloseTrip = closed || (selected.length > 0 && selected.every(id => merged || requests.find(item => item.id === id)?.status === "Trip scheduled"));
  const toggleRequest = (id: string) => { setMerged(false); setClosed(false); setSelected(items => items.includes(id) ? items.filter(item => item !== id) : [...items,id]); };
  const addPassengerToApprovedRequest = () => {
    if (!focused || focused.status !== "Approved") return;
    const staff = staffMembers.find(member => `${member.name} · EMP ${member.empNo}` === newPassenger || member.name === newPassenger.trim());
    const name = staff?.name ?? newPassenger.trim();
    if (!name) { announce("Enter a staff member, consultant or other passenger name."); return; }
    const current = passengerNames(focused);
    if (current.some(item => item.toLowerCase() === name.toLowerCase())) { announce(`${name} is already on this request.`); return; }
    onUpdateRequest(focused.id,{passengers:[...current,name],externalPassengers:staff ? focused.externalPassengers : [...(focused.externalPassengers ?? []),name]});
    setNewPassenger("");
    announce(`${name} added to ${focused.id} before dispatch.`);
  };
  const showRequestDetails = (id: string) => {
    setFocusedId(id);
    window.setTimeout(() => {
      const details = document.getElementById("admin-request-full-details");
      details?.scrollIntoView({ behavior: "smooth", block: "start" });
      details?.focus({ preventScroll: true });
    }, 0);
  };
  const createTrip = () => {
    selected.forEach(id => {
      const invNo = id.includes("-") ? id.split("-").pop()! : String(Date.now()).slice(-4);
      const tripId = `TR-${invNo}`;
      onUpdateRequest(id,{status:"Trip scheduled",tone:"blue",tripId,vehicle:`${vehicle} · ${vehicleType}`,vehicleCompany:vehicle,vehicleType,driver:undefined,pickupInstructions:undefined,dispatchedAt:new Date().toISOString(),adminNotes});
    });
    setMerged(true);
    announce("Operational trip dispatched and added to Trips out now.");
  };
  const openActiveTrip = (item: RequestItem) => {
    const linkedIds = requests.filter(request => request.status === "Trip scheduled" && (item.tripId ? request.tripId === item.tripId : request.id === item.id)).map(request => request.id);
    setSelected(linkedIds);
    setFocusedId(item.id);
    setVehicle(item.vehicleCompany ?? item.vehicle?.split(" · ")[0] ?? "");
    setVehicleType(item.vehicleType ?? item.vehicle?.split(" · ")[1] ?? "");
    setDriver(item.driver ?? "");
    setStandaloneMode(false);
    setMerged(true);
    setClosed(false);
    setMileage("");
    setFinalPrice("");
    setHighwayCost("");
    setPerDiemCost("");
    setOtherCost("");
    setReceiptRef("");
    setCompletionNotes("");
    setIncidentOpen(false);
    announce(`${item.tripId ?? item.id} opened for return entry.`);
  };
  const openIncident = (item: RequestItem) => { openActiveTrip(item); setIncidentOpen(true); announce(`${item.tripId ?? item.id} opened for breakdown and replacement entry.`); };
  const toggleStandalone = () => { setStandaloneMode(value => !value); setSelected([]); setMerged(false); setClosed(false); };
  const printManifest = () => { if (!focused) return; const names=passengerNames(focused); downloadCsv(`${focused.id}-passenger-manifest.csv`,[["Request","Passenger","Role","Status"],...names.map((name,index)=>[focused.id,name,index===0?"Primary requester":focused.externalPassengers?.includes(name)?"Other passenger / Consultant":"Staff passenger","Confirmed"])]); announce("Passenger manifest downloaded."); };
  const closeTrip = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const totalCost = Number(finalPrice) + Number(highwayCost) + Number(perDiemCost) + Number(otherCost);
    selected.forEach(id => {
      const req = requests.find(item => item.id === id);
      const invNo = id.includes("-") ? id.split("-").pop()! : (req?.tripId ? req.tripId.replace("TR-", "") : String(Date.now()).slice(-4));
      const tripId = `TR-${invNo}`;
      onUpdateRequest(id,{status:"Completed",tone:"green",mileageKm:Number(mileage),tripCostLkr:Number(finalPrice),highwayCostLkr:Number(highwayCost),perDiemCostLkr:Number(perDiemCost),otherCostLkr:Number(otherCost),finalPriceLkr:totalCost,completedAt,completedBy:adminName,receiptRef,completionNotes,tripId});
    });
    const returnedVehicle=vehicles.find(item=>vehicleLabel(item)===vehicle); if(returnedVehicle) onUpdateVehicle(returnedVehicle.id,{status:"Available"});
    setClosed(true);
  };
  const cancelActiveTrip = (item: RequestItem) => {
    const reason = window.prompt("Reason for cancelling this active trip:", "");
    if (reason === null) return;
    const linked = requests.filter(request => request.status === "Trip scheduled" && (item.tripId ? request.tripId === item.tripId : request.id === item.id));
    linked.forEach(request => onUpdateRequest(request.id,{status:"Cancelled",tone:"red",cancelledAt:new Date().toISOString(),cancelledBy:adminName,cancellationReason:reason.trim() || "Active trip cancelled by Admin."}));
    const activeVehicle = vehicles.find(vehicleItem=>vehicleLabel(vehicleItem)===(item.vehicle ?? vehicle));
    if (activeVehicle) onUpdateVehicle(activeVehicle.id,{status:"Available"});
    setSelected([]); setFocusedId(""); setMerged(false); setClosed(false);
    announce(`${item.tripId ?? item.id} cancelled by Admin. The vehicle is available again.`);
  };
  const saveIncident = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const reference = requests.find(item => item.id === selected[0]);
    if (!reference || !replacementVehicle) return;
    const incident: TripIncident = { id:`INC-${String(Date.now()).slice(-6)}`, recordedAt:incidentAt, recordedBy:adminName, location:incidentLocation, issue:incidentIssue, originalVehicle:reference.vehicle ?? vehicle ?? "Not recorded", originalDriver:reference.driver ?? driver ?? "Not recorded", replacementVehicle, replacementDriver:replacementDriver || reference.driver || driver || "Not recorded", actionTaken:incidentAction };
    selected.forEach(id => { const request=requests.find(item=>item.id===id); onUpdateRequest(id,{vehicle:replacementVehicle,driver:replacementDriver || request?.driver || driver,incidents:[...(request?.incidents ?? []),incident]}); });
    const failedVehicle=vehicles.find(item=>vehicleLabel(item)===(reference.vehicle ?? vehicle)); if(failedVehicle) onUpdateVehicle(failedVehicle.id,{status:"Out of service"});
    const replacement=vehicles.find(item=>vehicleLabel(item)===replacementVehicle); if(replacement) onUpdateVehicle(replacement.id,{status:"Available"});
    setVehicle(replacementVehicle); setDriver(replacementDriver || reference.driver || driver || ""); setIncidentOpen(false); setIncidentIssue(""); setIncidentLocation(""); setIncidentAction(""); setReplacementVehicle(""); setReplacementDriver("");
    announce(`${incident.id} saved. Replacement vehicle is now active on this trip.`);
  };

  return <><PageTitle eyebrow="AREA ADMIN CONTROL" title="Trip planning & operations" subtitle="Review complete request information, allocate transport and create a controlled operational trip." action={<button className="primary" onClick={toggleStandalone}>{standaloneMode?"× Cancel standalone setup":"＋ Create standalone trip"}</button>} />
    <div className="merge-banner"><div className="merge-symbol"><i/><i/><span>→</span><b/></div><div><p className="eyebrow">OPERATIONAL QUEUE</p><h3>{candidates.length} requests ready for admin review</h3><p>Select requests to merge, or open any request to inspect its full journey and approval details.</p></div><Status tone="blue">{requests.length} in office scope</Status></div>
    <div className="planning-workspace"><div className="planning-main">
      <section className="panel active-trips-panel"><div className="panel-head"><div><p className="eyebrow">LIVE MOVEMENT</p><h2>Trips out now</h2><p>Dispatched vehicles stay here until the Admin records their return and closes the trip.</p></div><span className="active-trip-count"><i/>{activeTrips.length} out</span></div>
        {activeTrips.length ? <div className="active-trip-list">{activeTrips.map(item => { const linkedCount = item.tripId ? requests.filter(request => request.status === "Trip scheduled" && request.tripId === item.tripId).length : 1; return <article className={selected.includes(item.id) && merged ? "active" : ""} key={item.tripId ?? item.id}><div className="active-trip-id"><span>{item.incidents?.length ? "REPLACEMENT ACTIVE" : "OUT NOW"}</span><strong>{item.tripId ?? item.id}</strong></div><div><strong>{item.route}</strong><small>{item.date} · {item.time} · {linkedCount} request{linkedCount === 1 ? "" : "s"}</small></div><div><span>SERVICE PROVIDER / TYPE</span><strong>{item.vehicleCompany ?? item.vehicle?.split(" · ")[0] ?? "Provider not recorded"}</strong><small>{item.vehicleType ?? item.vehicle?.split(" · ")[1] ?? "Type not recorded"}</small></div><div className="active-trip-actions"><button className="cancel-active-trip" onClick={() => cancelActiveTrip(item)}>× Cancel trip</button><button className="incident-button" onClick={() => openIncident(item)}>⚠ Breakdown</button><button onClick={() => openActiveTrip(item)}>Enter return details <span>→</span></button></div></article>})}</div> : <div className="active-trip-empty"><span>✓</span><div><strong>No vehicles are currently out</strong><p>Newly dispatched trips will appear here automatically.</p></div></div>}
      </section>
      <section className="panel trip-queue-panel"><div className="panel-head"><div><h2>Request queue</h2><p>Choose requests and inspect the full operational record before allocation.</p></div><span className="queue-count">{selected.length} selected</span></div>
        <div className="trip-request-list">{candidates.map((item,index) => <article className={`trip-request-card ${focused?.id === item.id ? "focused" : ""} ${selected.includes(item.id) ? "selected" : ""}`} key={item.id}><button className="trip-check" aria-label={`Select ${item.id}`} onClick={() => toggleRequest(item.id)}>{selected.includes(item.id) ? "✓" : ""}</button><span className={`avatar ${index % 2 ? "blue" : "pink"}`}>{item.person.split(" ").map(word=>word[0]).slice(0,2).join("")}</span><div className="trip-card-main"><div><strong>{item.person}</strong><Status tone={item.tone}>{item.status}</Status></div><p>{item.id} · {officeForRequest(item)}</p><b>{item.route}</b></div><div className="trip-card-travel"><span>TRAVEL</span><strong>{item.date} · {item.time}</strong><small>{passengerCount(item.id)} passenger{passengerCount(item.id) === 1 ? "" : "s"}</small></div><button className="details-button" aria-controls="admin-request-full-details" onClick={() => showRequestDetails(item.id)}>View full details <span>→</span></button></article>)}</div>
        <div className="combined-trip"><div><span>SELECTED REQUESTS</span><strong>{selected.length}</strong></div><div><span>TOTAL PASSENGERS</span><strong>{totalPassengers}</strong></div><div><span>EARLIEST DEPARTURE</span><strong>{candidates.find(item => selected.includes(item.id))?.time ?? "—"}</strong></div></div>
      </section>

      {focused && <section id="admin-request-full-details" tabIndex={-1} className="panel trip-detail-panel"><div className="trip-detail-title"><div><p className="eyebrow">FULL REQUEST DETAILS</p><h2>{focused.route}</h2><p>{focused.id} · Submitted by {focused.person}</p></div><Status tone={focused.tone}>{focused.status}</Status></div>
        <div className="trip-detail-grid"><div><span>Base office</span><strong>{officeForRequest(focused)}</strong></div><div><span>Departure</span><strong>{focused.date} · {focused.time}</strong></div><div><span>Expected return</span><strong>{focused.date} · 19:00</strong></div><div><span>Request type</span><strong>Field / Inter-office</strong></div><div><span>Budget code</span><strong>{focused.budget}</strong></div><div><span>Notice period</span><strong className="detail-ok">✓ Policy met</strong></div></div>
        <div className="detail-split"><article><span className="detail-label">BUSINESS PURPOSE</span><p>{focused.purpose ?? "Procurement-related works, staff capacity building and programme coordination at the destination office."}</p></article><article><span className="detail-label">REQUESTER CONTACT</span><p><strong>{focused.person}</strong><br/>{focused.person.toLowerCase().replaceAll(" ",".")}@chrysalis.lk · +94 77 245 1180</p></article></div>
        <div className="passenger-detail"><div className="detail-section-head"><div><h3>Passenger manifest</h3><p>{passengerCount(focused.id)} confirmed traveller{passengerCount(focused.id) === 1 ? "" : "s"}</p></div><button className="secondary" onClick={printManifest}>Download manifest</button></div><div className="manifest-list">{passengerNames(focused).map((name,index)=><div key={name}><span className={`avatar tiny ${index % 2 ? "blue" : "pink"}`}>{name.split(" ").map(word=>word[0]).slice(0,2).join("")}</span><span><strong>{name}</strong><small>{index === 0 ? "Primary requester" : focused.externalPassengers?.includes(name) ? "Other passenger / Consultant" : "Staff passenger"}</small></span><b>{index === 0 ? "Lead" : "Confirmed"}</b></div>)}</div>{focused.status === "Approved" && <div className="admin-passenger-add"><div><strong>Add a traveller before dispatch</strong><small>Select staff or type an outside passenger / consultant name.</small></div><div><input list="admin-passenger-directory" value={newPassenger} onChange={event=>setNewPassenger(event.target.value)} placeholder="Staff or other passenger full name" aria-label="Add staff or other passenger"/><datalist id="admin-passenger-directory">{staffMembers.map(staff=><option key={staff.empNo} value={`${staff.name} · EMP ${staff.empNo}`}>{staff.position} · {staff.office}</option>)}</datalist><button type="button" onClick={addPassengerToApprovedRequest}>＋ Add passenger</button></div></div>}</div>
        <div className="approval-audit"><div className="detail-section-head"><div><h3>Approval & audit path</h3><p>Decision trail for this request</p></div></div><div className="audit-steps"><div className="done"><i>✓</i><span><strong>Request submitted</strong><small>{focused.person} · 14 Aug, 09:12</small></span></div><b/><div className={focused.status === "Awaiting approval" ? "current" : "done"}><i>{focused.status === "Awaiting approval" ? "2" : "✓"}</i><span><strong>Budget approval</strong><small>Nadeesha Fernando · {focused.status === "Awaiting approval" ? "Pending" : "Approved"}</small></span></div><b/><div><i>3</i><span><strong>Admin transport allocation</strong><small>Service provider and type assignment</small></span></div></div></div>
      </section>}
    </div>

    <aside className="panel fleet-panel expanded-fleet"><div className="panel-head"><div><h2>Trip setup</h2><p>Complete operational allocation</p></div><span className="edit-live"><i/> LIVE</span></div>
      <label><span>Service provider *</span>
        <select value={vehicle} onChange={event => setVehicle(event.target.value)} required>
          <option value="" disabled>{availableCompanies.length ? "Select available service provider" : "No available service providers"}</option>
          {availableCompanies.map(comp => (
            <option key={comp} value={comp}>{comp}</option>
          ))}
        </select>
      </label>
      <label><span>Vehicle type *</span><select value={vehicleType} onChange={event => setVehicleType(event.target.value)}><option value="" disabled>Select vehicle type</option><option>Car</option><option>Van</option><option>Bus</option><option>Public transport</option><option>Lorry</option><option>Cab</option><option>Other</option></select></label>
      <label><span>Admin notes</span><textarea placeholder="Special requirements, route risks, accommodation or coordination notes" value={adminNotes} onChange={event => setAdminNotes(event.target.value)} /></label>
      {standaloneMode && <div className="demo-note"><span>i</span><p><strong>Standalone mode</strong> — allocate a service provider and vehicle type without linking a request.</p></div>}
      <div className="setup-checks"><p className={vehicle ? "done" : ""}><span>{vehicle ? "✓" : "1"}</span>Provider confirmed</p><p className={vehicleType ? "done" : ""}><span>{vehicleType ? "✓" : "2"}</span>Vehicle type confirmed</p><p className={selected.length >= 1 || standaloneMode ? "done" : ""}><span>{selected.length >= 1 || standaloneMode ? "✓" : "3"}</span>{standaloneMode?"Standalone trip enabled":"Request selected"}</p></div>
      {merged ? <div className="success-banner"><span>✓</span><div><strong>{standaloneMode?"Standalone trip":"Operational trip"} created</strong><p>Service provider, vehicle type and admin notes were saved.</p></div></div> : <button className="primary wide create-trip-button" disabled={(!selected.length && !standaloneMode) || !vehicle || !vehicleType} onClick={createTrip}>Create {standaloneMode?"standalone":"operational"} trip <span>→</span></button>}
      <section className={`incident-control ${selected.some(id=>requests.find(item=>item.id===id)?.status === "Trip scheduled") ? "available" : ""}`}><div className="incident-head"><span>⚠</span><div><strong>Mid-trip incident & replacement</strong><p>Record a breakdown or other incident while a vehicle is out, then assign the replacement.</p></div>{!incidentOpen && <button disabled={!selected.some(id=>requests.find(item=>item.id===id)?.status === "Trip scheduled")} onClick={()=>setIncidentOpen(true)}>Report incident</button>}</div>{focused?.incidents?.length ? <div className="incident-history"><strong>{focused.incidents.length} incident{focused.incidents.length===1?"":"s"} recorded</strong><span>Latest: {focused.incidents.at(-1)?.id} · {focused.incidents.at(-1)?.replacementVehicle}</span></div> : null}{incidentOpen && <form className="incident-form" onSubmit={saveIncident}><div className="incident-grid"><label><span>Incident date & time *</span><input type="datetime-local" value={incidentAt} onChange={event=>setIncidentAt(event.target.value)} required /></label><label><span>Breakdown location *</span><input value={incidentLocation} onChange={event=>setIncidentLocation(event.target.value)} placeholder="Example: Mawanella, A1 road" required /></label><label className="wide"><span>Fault / incident details *</span><textarea value={incidentIssue} onChange={event=>setIncidentIssue(event.target.value)} placeholder="Describe what happened and the vehicle condition" required /></label><label><span>Replacement vehicle *</span><select value={replacementVehicle} onChange={event=>setReplacementVehicle(event.target.value)} required><option value="" disabled>Select replacement vehicle</option>{replacementVehicles.map(item=><option key={item.id} value={vehicleLabel(item)}>{vehicleLabel(item)} · {item.office}</option>)}</select></label><label><span>Replacement driver</span><select value={replacementDriver} onChange={event=>setReplacementDriver(event.target.value)}><option value="">Keep current driver</option><option>Sunil Rathnayake · +94 77 318 4402</option><option>Mohamed Irfan · +94 76 552 0911</option><option>Chamara Silva · +94 71 884 2106</option></select></label><label className="wide"><span>Action taken / recovery notes</span><textarea value={incidentAction} onChange={event=>setIncidentAction(event.target.value)} placeholder="Recovery arranged, passengers transferred, garage informed..." /></label></div><div className="incident-form-actions"><button type="button" className="secondary" onClick={()=>setIncidentOpen(false)}>Cancel</button><button type="submit" className="incident-save">Save incident & activate replacement</button></div></form>}</section>
      <section className={`trip-closure ${canCloseTrip ? "ready" : ""}`}><div className="closure-head"><span>↙</span><div><strong>Return details & close trip</strong><p>Enter mileage and every cost item. The full total is calculated automatically for Reports.</p></div></div>{canCloseTrip && (closed ? <div className="closure-success"><span>✓</span><div><strong>Mileage and full cost saved to reports</strong><p>{mileage} km · Total LKR {tripTotal.toLocaleString()} · {completedAt}</p></div></div> : <form onSubmit={closeTrip}><div className="closure-grid"><label><span>Actual mileage (km) *</span><input type="number" min="1" value={mileage} onChange={event => setMileage(event.target.value)} required /></label><label><span>Trip / vehicle cost (LKR) *</span><input type="number" min="0" value={finalPrice} onChange={event => setFinalPrice(event.target.value)} required /></label><label><span>Highway cost (LKR)</span><input type="number" min="0" value={highwayCost} onChange={event => setHighwayCost(event.target.value)} placeholder="0" /></label><label><span>Per diem (LKR)</span><input type="number" min="0" value={perDiemCost} onChange={event => setPerDiemCost(event.target.value)} placeholder="0" /></label><label><span>Other cost (LKR)</span><input type="number" min="0" value={otherCost} onChange={event => setOtherCost(event.target.value)} placeholder="0" /></label><label><span>Completion date *</span><input type="date" value={completedAt} onChange={event => setCompletedAt(event.target.value)} required /></label><label><span>Receipt / voucher reference</span><input value={receiptRef} placeholder="PV-2026-0081" onChange={event => setReceiptRef(event.target.value)} /></label></div><div className="cost-total-preview"><span>Full trip cost</span><strong>LKR {tripTotal.toLocaleString()}</strong><small>Trip + Highway + Per diem + Other</small></div><label><span>Completion notes</span><textarea value={completionNotes} placeholder="Journey completed safely, delays, route changes or vehicle observations" onChange={event => setCompletionNotes(event.target.value)} /></label><button className="close-trip-button" type="submit">✓ Save actuals & complete trip</button></form>)}</section>
    </aside></div>
  </>; 
}

function DirectChat({ users, currentUser, currentRole, conversations, onChange }: { users: UserRecord[]; currentUser: string; currentRole: Role; conversations: DirectConversation[]; onChange: (items: DirectConversation[]) => void }) {
  const [search,setSearch] = useState("");
  const [selectedId,setSelectedId] = useState(conversations[0]?.id ?? "");
  const [draft,setDraft] = useState("");
  const people = users.filter(user=>user.active && user.name !== currentUser).filter((user,index,list)=>list.findIndex(item=>item.name===user.name)===index).sort((a,b)=>a.name.localeCompare(b.name));
  const matches = people.filter(user=>`${user.name} ${user.position ?? ""} ${user.office} ${roleConfig[user.displayRole ?? user.role].label}`.toLowerCase().includes(search.toLowerCase()));
  const myConversations = conversations.filter(item=>item.participants.includes(currentUser)).sort((a,b)=>new Date(b.updatedAt).getTime()-new Date(a.updatedAt).getTime());
  const active = myConversations.find(item=>item.id===selectedId);
  const otherName = active?.participants.find(name=>name!==currentUser) ?? "";
  const otherUser = users.find(user=>user.name===otherName);
  const openPerson = (person: UserRecord) => {
    const existing=myConversations.find(item=>item.participants.includes(person.name));
    if (existing) { setSelectedId(existing.id); setSearch(""); return; }
    const created: DirectConversation={id:`DM-${Date.now()}`,participants:[currentUser,person.name],messages:[],updatedAt:new Date().toISOString()};
    onChange([created,...conversations]);
    setSelectedId(created.id);
    setSearch("");
  };
  const sendMessage = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text=draft.trim();
    if (!active || !text) return;
    const message: RequestMessage={id:`MSG-${Date.now()}`,author:currentUser,authorRole:roleConfig[currentRole].label,text,sentAt:new Date().toISOString()};
    onChange(conversations.map(item=>item.id===active.id?{...item,messages:[...item.messages,message],updatedAt:message.sentAt}:item));
    setDraft("");
    announce(`Message sent to ${otherName}.`);
  };
  return <><PageTitle eyebrow="STAFF COMMUNICATION" title="Chat" subtitle="Find any colleague and start a private one-to-one conversation, just like Teams." />
    <section className="request-chat-shell direct-chat-shell panel">
      <aside className="chat-thread-sidebar"><header><div><h2>Chat</h2><span>{myConversations.length} conversation{myConversations.length===1?"":"s"}</span></div></header><label><span>⌕</span><input value={search} onChange={event=>setSearch(event.target.value)} placeholder="Search staff by name, role or office" aria-label="Search staff to chat"/></label><div className="chat-thread-list">{search ? <><p className="chat-list-label">PEOPLE</p>{matches.slice(0,30).map(user=><button key={user.id} onClick={()=>openPerson(user)}><span className="avatar blue">{user.name.split(" ").map(word=>word[0]).slice(0,2).join("")}</span><span><strong>{user.name}</strong><small>{user.position ?? roleConfig[user.displayRole ?? user.role].label}</small><em>{user.office}</em></span><i>＋</i></button>)}</> : <><p className="chat-list-label">RECENT</p>{myConversations.map(item=>{const person=item.participants.find(name=>name!==currentUser) ?? "Unknown user";const last=item.messages.at(-1);return <button key={item.id} className={active?.id===item.id?"active":""} onClick={()=>setSelectedId(item.id)}><span className="avatar blue">{person.split(" ").map(word=>word[0]).slice(0,2).join("")}</span><span><strong>{person}</strong><small>{users.find(user=>user.name===person)?.position ?? "Staff member"}</small><em>{last?.text ?? "Start a conversation"}</em></span><i>{item.messages.length||""}</i></button>})}<p className="chat-list-label people-heading">ALL PEOPLE</p>{people.slice(0,12).map(user=><button key={user.id} onClick={()=>openPerson(user)}><span className="avatar pink">{user.name.split(" ").map(word=>word[0]).slice(0,2).join("")}</span><span><strong>{user.name}</strong><small>{user.position ?? roleConfig[user.displayRole ?? user.role].label}</small><em>{user.office}</em></span><i>＋</i></button>)}</>}</div></aside>
      <div className="chat-conversation">{active ? <><header><span className="avatar pink">{otherName.split(" ").map(word=>word[0]).slice(0,2).join("")}</span><div><h2>{otherName}</h2><p>{otherUser?.position ?? roleConfig[otherUser?.displayRole ?? otherUser?.role ?? "user"].label} · {otherUser?.office ?? "Chrysalis"}</p></div><span className="chat-online"><i/> Active</span></header><div className="chat-messages">{active.messages.length ? active.messages.map(message=><article key={message.id} className={message.author===currentUser?"mine":""}><span className="avatar tiny">{message.author.split(" ").map(word=>word[0]).slice(0,2).join("")}</span><div><header><strong>{message.author}</strong><small>{new Date(message.sentAt).toLocaleString()}</small></header><p>{message.text}</p></div></article>) : <div className="chat-welcome"><span>✦</span><h3>Start chatting with {otherName.split(" ")[0]}</h3><p>Use this private conversation for quick coordination without making a phone call.</p></div>}</div></> : <div className="chat-no-selection"><span>CH</span><h2>Start a new chat</h2><p>Search or select a colleague from the left to begin messaging.</p></div>}</div>
      {active && <form className="chat-composer direct-chat-compose-dock" onSubmit={sendMessage}><label htmlFor="direct-chat-message">NEW MESSAGE</label><div><button type="button" title="Add thumbs up" aria-label="Add thumbs up" onClick={()=>setDraft(value=>`${value}${value?" ":""}👍`)}>☺</button><textarea id="direct-chat-message" value={draft} onChange={event=>setDraft(event.target.value)} placeholder="Type a new message" aria-label={`Message ${otherName}`} rows={2}/><button type="submit" disabled={!draft.trim()}>Send <span>➤</span></button></div><small>Private conversation · visible only to both participants</small></form>}
    </section></>;
}

function RequestChat({ requests, currentUser, currentRole, onUpdateRequest }: { requests: RequestItem[]; currentUser: string; currentRole: Role; onUpdateRequest: (id: string, patch: Partial<RequestItem>) => void }) {
  const canSeeEveryThread = currentRole === "admin" || currentRole === "super_admin";
  const availableThreads = requests.filter(item => canSeeEveryThread || item.person === currentUser || item.passengers?.includes(currentUser) || item.approverNames?.includes(currentUser));
  const [search,setSearch] = useState("");
  const [selectedId,setSelectedId] = useState(availableThreads[0]?.id ?? "");
  const [draft,setDraft] = useState("");
  const filteredThreads = availableThreads.filter(item => `${item.id} ${item.person} ${item.route}`.toLowerCase().includes(search.toLowerCase()));
  const active = availableThreads.find(item=>item.id===selectedId) ?? filteredThreads[0];
  useEffect(()=>{ if (!active && filteredThreads[0]) setSelectedId(filteredThreads[0].id); },[active,filteredThreads]);
  const sendMessage = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text=draft.trim();
    if (!active || !text) return;
    const message: RequestMessage = { id:`MSG-${Date.now()}`, author:currentUser, authorRole:roleConfig[currentRole].label, text, sentAt:new Date().toISOString() };
    onUpdateRequest(active.id,{messages:[...(active.messages ?? []),message]});
    setDraft("");
    announce(`Message sent to ${active.id}.`);
  };
  return <><PageTitle eyebrow="REQUEST COMMUNICATION" title="Request chat" subtitle="Coordinate each journey with the requester, approvers and Admin in one shared conversation." />
    <section className="request-chat-shell panel">
      <aside className="chat-thread-sidebar"><header><div><h2>Chats</h2><span>{availableThreads.length} request thread{availableThreads.length===1?"":"s"}</span></div></header><label><span>⌕</span><input value={search} onChange={event=>setSearch(event.target.value)} placeholder="Search request or person" aria-label="Search request chats"/></label><div className="chat-thread-list">{filteredThreads.map(item=>{const last=item.messages?.at(-1);return <button key={item.id} className={active?.id===item.id?"active":""} onClick={()=>setSelectedId(item.id)}><span className="avatar blue">{item.person.split(" ").map(word=>word[0]).slice(0,2).join("")}</span><span><strong>{item.route}</strong><small>{item.id} · {item.person}</small><em>{last?.text ?? "Start request coordination"}</em></span><i>{item.messages?.length ?? 0}</i></button>})}{!filteredThreads.length&&<div className="chat-empty-small"><strong>No request chats</strong><span>Related requests will appear here.</span></div>}</div></aside>
      <div className="chat-conversation">{active ? <><header><span className="avatar pink">{active.person.split(" ").map(word=>word[0]).slice(0,2).join("")}</span><div><h2>{active.route}</h2><p>{active.id} · {active.person} · {active.status}</p></div><Status tone={active.tone}>{active.status}</Status></header><div className="chat-participants"><span>Participants</span><strong>{[active.person,...(active.approverNames ?? []),"Area Admin"].filter((name,index,list)=>list.indexOf(name)===index).join(" · ")}</strong></div><div className="chat-messages">{active.messages?.length ? active.messages.map(message=><article key={message.id} className={message.author===currentUser?"mine":""}><span className="avatar tiny">{message.author.split(" ").map(word=>word[0]).slice(0,2).join("")}</span><div><header><strong>{message.author}</strong><small>{message.authorRole} · {new Date(message.sentAt).toLocaleString()}</small></header><p>{message.text}</p></div></article>) : <div className="chat-welcome"><span>✦</span><h3>Start the coordination here</h3><p>Ask about passengers, timing, pickup instructions or approval updates. Everyone related to this request sees the same conversation.</p></div>}</div><form className="chat-composer" onSubmit={sendMessage}><div><button type="button" title="Add thumbs up" onClick={()=>setDraft(value=>`${value}${value?" ":""}👍`)}>☺</button><textarea value={draft} onChange={event=>setDraft(event.target.value)} placeholder={`Message everyone on ${active.id}`} aria-label="Type a request chat message" rows={2}/><button type="submit" disabled={!draft.trim()}>Send ➤</button></div><small>Messages are saved to the request activity history.</small></form></> : <div className="chat-no-selection"><span>CH</span><h2>Select a request conversation</h2><p>Your related request threads will appear on the left.</p></div>}</div>
    </section></>;
}

function TripCalendar({ requests, currentUser, approvedOnly = false, onNew, onCancelRequest }: { requests: RequestItem[]; currentUser: string; approvedOnly?: boolean; onNew: () => void; onCancelRequest: (id: string, patch: Partial<RequestItem>) => void }) {
  type CalendarEvent = { id: string; owner: string; route: string; date: Date; day: number; time: string; end: string; returnDate: string; returnTime: string; departureDate: string; office: string; status: string; tone: string; passengers: number; passengerNames: string[]; purpose: string; vehicleCompany?: string; vehicleType?: string; driver?: string; tripId?: string };
  const personInitials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0]).join("").toUpperCase();
  const startOfDay = (value: Date) => new Date(value.getFullYear(),value.getMonth(),value.getDate());
  const startOfWorkWeek = (value: Date) => { const date=startOfDay(value); const day=date.getDay(); date.setDate(date.getDate()-(day===0?6:day-1)); return date; };
  const parseRequestDate = (value: string) => { const clean=value.trim(); const iso=clean.match(/^(\d{4})-(\d{2})-(\d{2})$/); if(iso) return new Date(Number(iso[1]),Number(iso[2])-1,Number(iso[3])); const numeric=clean.match(/^(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{4}))?$/); if(numeric) return new Date(Number(numeric[3]??2026),Number(numeric[2])-1,Number(numeric[1])); const parsed=new Date(/\b\d{4}\b/.test(clean)?clean:`${clean} 2026`); return Number.isNaN(parsed.getTime())?null:startOfDay(parsed); };
  const formatTripDate = (val?: string) => { if (!val) return ""; const clean = val.trim(); const iso = clean.match(/^(\d{4})-(\d{2})-(\d{2})$/); if (iso) { const d = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])); return d.toLocaleDateString("en-US", { day: "numeric", month: "short" }); } return clean; };
  const dateKey = (value: Date) => `${value.getFullYear()}-${String(value.getMonth()+1).padStart(2,"0")}-${String(value.getDate()).padStart(2,"0")}`;
  const baseWeekStart = startOfWorkWeek(new Date());
  const [showMine,setShowMine] = useState(true);
  const [showTeam,setShowTeam] = useState(true);
  const [mode,setMode] = useState<"week"|"schedule">("week");
  const [selectedId,setSelectedId] = useState<string | null>(null);
  const [weekOffset,setWeekOffset] = useState(0);
  const [monthOffset,setMonthOffset] = useState(0);
  const [selectedMiniDate,setSelectedMiniDate] = useState(new Date().getDate());
  const weekStart = new Date(baseWeekStart); weekStart.setDate(baseWeekStart.getDate()+weekOffset*7);
  const days = Array.from({length:5},(_,index)=>{const value=new Date(weekStart);value.setDate(weekStart.getDate()+index);return {name:value.toLocaleDateString("en-US",{weekday:"short"}).toUpperCase(),date:value.getDate(),value,key:dateKey(value)};});
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate()+4);
  const weekLabel = weekStart.getMonth()===weekEnd.getMonth()?`${weekStart.getDate()}–${weekEnd.getDate()} ${weekEnd.toLocaleDateString("en-US",{month:"long",year:"numeric"})}`:`${weekStart.toLocaleDateString("en-US",{day:"numeric",month:"short"})}–${weekEnd.toLocaleDateString("en-US",{day:"numeric",month:"short",year:"numeric"})}`;
  const miniDate = new Date(baseWeekStart.getFullYear(),baseWeekStart.getMonth()+monthOffset,1);
  const miniMonth = miniDate.toLocaleDateString("en-US",{month:"long",year:"numeric"});
  const miniLeadingDays = (miniDate.getDay()+6)%7;
  const miniDaysInMonth = new Date(miniDate.getFullYear(),miniDate.getMonth()+1,0).getDate();
  const hours = Array.from({length:13},(_,index)=>index+6);
  const requestEvents: CalendarEvent[] = requests.flatMap(item => {
    const date = parseRequestDate(item.date);
    const returnTime = item.returnTime ?? `${String(Math.min(Number.parseInt(item.time,10)+3,19)).padStart(2,"0")}:00`;
    const returnDate = formatTripDate(item.returnDate ?? item.date);
    const departureDate = formatTripDate(item.date);
    const passengerNames = Array.from(new Set([item.person,...(item.passengers ?? [])].filter(Boolean)));
    return date ? [{
      id: item.id,
      owner: item.person,
      route: item.route,
      date,
      day: 0,
      time: item.time,
      end: returnTime,
      returnDate,
      returnTime,
      departureDate,
      office: officeForRequest(item),
      status: item.status,
      tone: item.tone,
      passengers: passengerNames.length,
      passengerNames,
      purpose: item.purpose ?? "Field visit and programme coordination",
      vehicleCompany: item.vehicleCompany ?? (item.vehicle ? item.vehicle.split(" · ")[0] : undefined),
      vehicleType: item.vehicleType ?? (item.vehicle ? item.vehicle.split(" · ")[1] : undefined),
      driver: item.driver,
      tripId: item.tripId
    }] : [];
  });
  const allEvents = requestEvents;
  const statusEvents = approvedOnly ? allEvents.filter(item => item.owner === currentUser ? ["Awaiting approval","Needs revision","Approved","Trip scheduled"].includes(item.status) : item.status === "Approved" || item.status === "Trip scheduled") : allEvents;
  const calendarEvents = statusEvents.map(item=>({...item,day:Math.round((startOfDay(item.date).getTime()-weekStart.getTime())/86400000)})).filter(item=>item.day>=0&&item.day<5);
  const visibleEvents = calendarEvents.filter(item => (item.owner === currentUser && showMine) || (item.owner !== currentUser && showTeam));
  const selected = calendarEvents.find(item => item.id === selectedId) ?? null;
  const selectedRequest = selected ? requests.find(item=>item.id===selected.id) : undefined;
  const canRequesterCancel = Boolean(selectedRequest && selectedRequest.person===currentUser && !selectedRequest.dispatchedAt && !["Trip scheduled","Completed","Cancelled"].includes(selectedRequest.status));
  const cancelOwnRequest = () => { if(!selectedRequest||!canRequesterCancel)return; const reason=window.prompt("Reason for cancelling this request:",""); if(reason===null)return; onCancelRequest(selectedRequest.id,{status:"Cancelled",tone:"red",cancelledAt:new Date().toISOString(),cancelledBy:currentUser,cancellationReason:reason.trim()||"Cancelled by requester before dispatch."}); setSelectedId(null); announce(`${selectedRequest.id} cancelled successfully.`); };
  const eventTop = (time: string) => { const [hour,minute] = time.split(":").map(Number); return ((hour-6)*60+minute)/60*54; };
  const eventHeight = (start: string,end: string) => { const [sh,sm]=start.split(":").map(Number); const [eh,em]=end.split(":").map(Number); return Math.max(40,((eh*60+em)-(sh*60+sm))/60*54); };
  const eventMinutes = (time: string) => { const [hour,minute]=time.split(":").map(Number); return hour*60+minute; };
  const getDayEventLayouts = (dayEvents: CalendarEvent[]) => {
    const sorted = [...dayEvents].sort((a, b) => {
      const diff = eventMinutes(a.time) - eventMinutes(b.time);
      if (diff !== 0) return diff;
      return a.id.localeCompare(b.id);
    });
    const layoutMap = new Map<string, { top: number; height: number }>();
    let nextAvailableTop = 0;
    const CARD_GAP = 12;

    const calcCardHeight = (ev: CalendarEvent) => {
      const routeText = (ev.route || "").trim();
      let routeLines = 1;
      if (routeText.length > 46) {
        routeLines = 3;
      } else if (routeText.length > 22) {
        routeLines = 2;
      }

      let h = 122; // base comfortable height
      if (routeLines === 2) h += 28;
      else if (routeLines === 3) h += 52;

      if (ev.returnDate) {
        h += 34; // return date banner
      }

      return h;
    };

    sorted.forEach(ev => {
      const cardH = calcCardHeight(ev);
      const targetTop = eventTop(ev.time);
      const top = Math.max(targetTop, nextAvailableTop);
      layoutMap.set(ev.id, { top, height: cardH });
      nextAvailableTop = top + cardH + CARD_GAP;
    });

    return layoutMap;
  };

  const maxCalendarHeight = useMemo(() => {
    let max = 760;
    days.forEach((_, dayIndex) => {
      const dayEvents = visibleEvents.filter(item => item.day === dayIndex);
      const layouts = getDayEventLayouts(dayEvents);
      layouts.forEach(l => {
        if (l.top + l.height + 40 > max) {
          max = l.top + l.height + 40;
        }
      });
    });
    return max;
  }, [visibleEvents, days]);

  return <><PageTitle eyebrow="SHARED MOBILITY CALENDAR" title="Trips calendar" subtitle="See your journeys and the wider team schedule in a familiar Outlook-style calendar." action={<button className="primary" onClick={onNew}>＋ New vehicle request</button>} />
    <div className="calendar-shell"><aside className="panel calendar-sidebar"><button className="calendar-new" onClick={onNew}>＋ New request</button><div className="mini-calendar"><div><button aria-label="Previous month" onClick={()=>setMonthOffset(value=>value-1)}>‹</button><strong>{miniMonth}</strong><button aria-label="Next month" onClick={()=>setMonthOffset(value=>value+1)}>›</button></div><div className="mini-weekdays">{["M","T","W","T","F","S","S"].map((day,index)=><span key={`${day}-${index}`}>{day}</span>)}</div><div className="mini-days">{Array.from({length:42},(_,index)=>{const date=index-miniLeadingDays+1;const valid=date>0&&date<=miniDaysInMonth;return <button key={index} onClick={()=>{if(valid){const chosen=new Date(miniDate.getFullYear(),miniDate.getMonth(),date);const chosenWeek=startOfWorkWeek(chosen);setWeekOffset(Math.round((chosenWeek.getTime()-baseWeekStart.getTime())/604800000));setSelectedMiniDate(date);setSelectedId(null);announce(`Calendar date ${date} ${miniMonth} selected.`)}}} className={valid&&date===selectedMiniDate&&miniDate.getMonth()===weekStart.getMonth()?"today":!valid?"muted":""}>{valid?date:""}</button>})}</div></div><div className="calendar-lists"><p>MY CALENDARS</p><label><input type="checkbox" checked={showMine} onChange={event=>setShowMine(event.target.checked)}/><i className="mine"/><span>My trips</span><b>{calendarEvents.filter(item=>item.owner===currentUser).length}</b></label><label><input type="checkbox" checked={showTeam} onChange={event=>setShowTeam(event.target.checked)}/><i className="team"/><span>Team trips</span><b>{calendarEvents.filter(item=>item.owner!==currentUser).length}</b></label></div><div className="calendar-legend"><p>STATUS</p><span><i className="green"/>Approved</span><span><i className="blue"/>Scheduled</span>{!approvedOnly && <span><i className="amber"/>Awaiting approval</span>}</div><div className="calendar-tip"><span>i</span><p>{approvedOnly ? "Only approved and scheduled journeys are shown to requesters." : "Team calendars show journey timing and coordination details without exposing budget information."}</p></div></aside>
      <section className="panel calendar-main"><div className="calendar-toolbar"><div><button onClick={()=>{setWeekOffset(0);setSelectedId(null)}}>Today</button><button aria-label="Previous week" onClick={()=>{setWeekOffset(value=>value-1);setSelectedId(null)}}>‹</button><button aria-label="Next week" onClick={()=>{setWeekOffset(value=>value+1);setSelectedId(null)}}>›</button><h2>{weekLabel}</h2></div><div className="calendar-view-switch"><button className={mode==="week"?"active":""} onClick={()=>setMode("week")}>Work week</button><button className={mode==="schedule"?"active":""} onClick={()=>setMode("schedule")}>Schedule</button></div></div>
        {mode === "week" ? <div className="week-calendar"><div className="week-header"><span/><>{days.map(day=><div key={day.key} className={day.key===dateKey(new Date())?"today":""}><small>{day.name}</small><strong>{day.date}</strong></div>)}</></div><div className="week-body" style={{minHeight:`${maxCalendarHeight}px`}}><div className="time-axis" style={{minHeight:`${maxCalendarHeight}px`}}>{hours.map(hour=><span key={hour}>{String(hour).padStart(2,"0")}:00</span>)}</div>{days.map((day,dayIndex)=>{const dayEvents=visibleEvents.filter(item=>item.day===dayIndex).sort((a,b)=>eventMinutes(a.time)-eventMinutes(b.time)||a.id.localeCompare(b.id));const dayLayouts=getDayEventLayouts(dayEvents);return <div className={`day-column ${day.key===dateKey(new Date())?"today":""}`} key={day.key} style={{minHeight:`${maxCalendarHeight}px`}}>{hours.map(hour=><i key={hour}/>)}{dayEvents.map(event=>{const pos=dayLayouts.get(event.id);return <button key={event.id} title={`${event.time}–${event.end} · ${event.route} · Return: ${event.returnDate} ${event.returnTime} · ${event.owner}`} aria-label={`${event.route}, ${event.time} to ${event.end}, Return: ${event.returnDate} ${event.returnTime}, ${event.owner}`} className={`calendar-event ${event.owner===currentUser?"mine":"team"} ${event.tone}`} style={{top:`${pos?.top ?? eventTop(event.time)}px`,height:`${pos?.height ?? 168}px`}} onClick={()=>setSelectedId(event.id)}>
          <div className="cal-card-head">
            <span className="cal-card-times">
              <i className="cal-card-icon">🚗</i>
              <strong>{event.time}</strong>
              <span className="cal-arrow">→</span>
              <strong>{event.end}</strong>
            </span>
            <span className={`cal-badge ${event.tone}`}>{event.status}</span>
          </div>
          <div className="cal-card-route" title={event.route}>{event.route}</div>
          <div className="cal-card-pills">
            <span className="cal-pill">REF: <b>{event.id}</b></span>
            <span className="cal-pill">PAX: <b>{event.passengers}</b></span>
          </div>
          <div className="cal-card-return" title={`Return: ${event.returnDate} at ${event.returnTime}`}>
            <span className="cal-return-icon">↩</span>
            <span className="cal-return-text">Return: <strong>{event.returnDate} · {event.returnTime}</strong></span>
          </div>
          <div className="cal-card-footer">
            <span className="cal-owner" title={event.owner}>👤 {event.owner===currentUser?`${event.owner} (You)`:event.owner}</span>
            {event.vehicleCompany ? <span className="cal-vehicle" title={event.vehicleCompany}>🏢 {event.vehicleCompany}</span> : <span className="cal-office" title={event.office}>📍 {event.office}</span>}
          </div>
        </button>;})}</div>;})}</div></div> : <div className="schedule-view">{days.map((day,dayIndex)=><section key={day.key} className="schedule-day-section"><div className="schedule-date"><strong>{day.date}</strong><span>{day.name}<small>{day.value.toLocaleDateString("en-US",{month:"long"}).toUpperCase()}</small></span></div><div className="schedule-day-list">{visibleEvents.filter(item=>item.day===dayIndex).length ? visibleEvents.filter(item=>item.day===dayIndex).map(event=><button key={event.id} onClick={()=>setSelectedId(event.id)} className={`schedule-card-detailed ${event.tone}`}>
          <div className="sched-times">
            <span className="sched-dep">🛫 {event.time}</span>
            <span className="sched-arr">🛬 {event.end}</span>
          </div>
          <div className="sched-main">
            <div className="sched-head">
              <strong className="sched-route">{event.route}</strong>
              <span className={`cal-badge ${event.tone}`}>{event.status}</span>
            </div>
            <div className="sched-meta">
              <span className="cal-pill">REF: <b>{event.id}</b></span>
              <span className="cal-pill">PAX: <b>{event.passengers}</b></span>
              {event.returnDate && <span className="cal-card-return sched-return-pill">
                <span className="cal-return-icon">↩</span>
                <span>Return: <strong>{event.returnDate} · {event.returnTime}</strong></span>
              </span>}
              <span className="sched-owner">👤 <b>{event.owner}</b></span>
              {event.vehicleCompany ? <span className="sched-vehicle">🏢 <b>{event.vehicleCompany}</b></span> : <span className="cal-office">📍 {event.office}</span>}
            </div>
          </div>
        </button>) : <p className="schedule-empty-day">No trips scheduled</p>}</div></section>)}</div>}
        {selected && <div className="trip-modal-backdrop">
          <section className="trip-modal" role="dialog" aria-modal="true" aria-labelledby="trip-modal-title">
            <button className="trip-modal-close" aria-label="Close trip details" onClick={()=>setSelectedId(null)}>×</button>
            <header className="trip-modal-header">
              <div className="trip-modal-date"><span>{days[selected.day].name}</span><strong>{days[selected.day].date}</strong><small>{days[selected.day].value.toLocaleDateString("en-US",{month:"short",year:"numeric"}).toUpperCase()}</small></div>
              <div><p>SHARED TRIP REQUEST</p><h2 id="trip-modal-title">{selected.route}</h2><span>Visible to the wider team for journey coordination</span></div>
              <Status tone={selected.tone}>{selected.status}</Status>
            </header>
            <div className="trip-route-visual"><i/><div><small>DEPARTURE</small><strong>{selected.route.split(" → ")[0]}</strong></div><span>→</span><div><small>DESTINATION</small><strong>{selected.route.split(" → ")[1] ?? selected.route}</strong></div></div>
            <div className="trip-modal-facts">
              <div><small>DEPARTURE TIME</small><strong>{selected.time}</strong><span>{days[selected.day].value.toLocaleDateString("en-US",{weekday:"long",day:"numeric",month:"long"})}</span></div>
              <div><small>EXPECTED RETURN</small><strong>{selected.end}</strong><span>Same day</span></div>
              <div><small>BASE OFFICE</small><strong>{selected.office}</strong><span>Coordinating office</span></div>
              <div><small>REQUEST REFERENCE</small><strong>{selected.id}</strong><span>Approved travel request</span></div>
            </div>
            <div className="trip-modal-sections">
              <article><small>TRIP PURPOSE</small><h3>{selected.purpose}</h3><p>Use this information to confirm whether your journey can be coordinated with this trip.</p></article>
              <article><small>COORDINATION CONTACT</small><h3>{selected.owner}{selected.owner===currentUser?" (You)":""}</h3><p>Primary requester and coordination contact for this journey.</p></article>
            </div>
            <section className="trip-modal-passengers">
              <div><small>PEOPLE TRAVELLING</small><strong>{selected.passengers} {selected.passengers===1?"person":"people"}</strong></div>
              <div className="trip-people-list">{selected.passengerNames.map((name,index)=><div key={`${selected.id}-${name}`}><span>{personInitials(name)}</span><p><strong>{name}{name===currentUser?" (You)":""}</strong><small>{index===0?"Requester / traveller":"Passenger"}</small></p></div>)}</div>
            </section>
            <footer className="trip-modal-footer"><p><strong>{canRequesterCancel?"Cancellation available before dispatch":"Shared operational information"}</strong><span>{selectedRequest?.dispatchedAt?"This trip has started. Only an Admin can cancel it now.":"Journey details are visible to team users. Budget and financial details remain private."}</span></p>{canRequesterCancel&&<button className="cancel-own-request" onClick={cancelOwnRequest}>× Cancel my request</button>}<button className="secondary" onClick={()=>setSelectedId(null)}>Done</button></footer>
          </section>
        </div>}
      </section></div>
  </>;
}

function VehicleManagement({ vehicles, office, offices, canViewAll, onAdd, onUpdate }: { vehicles: VehicleRecord[]; office: string; offices: string[]; canViewAll: boolean; onAdd: (vehicle: VehicleRecord) => void; onUpdate: (id: string, patch: Partial<VehicleRecord>) => void }) {
  const [showAdd,setShowAdd] = useState(false);
  const [editingVehicle,setEditingVehicle] = useState<VehicleRecord | null>(null);
  const [officeFilter,setOfficeFilter] = useState(canViewAll ? "All offices" : office);
  const [company,setCompany] = useState("");
  const visible = officeFilter === "All offices" ? vehicles : vehicles.filter(vehicle=>vehicle.office===officeFilter);
  const addVehicle = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = company.trim();
    if (!name) return;
    onAdd({
      id: `VEH-${String(Date.now()).slice(-6)}`,
      registration: name,
      company: name,
      model: "Transport Partner",
      type: "Company",
      seats: 0,
      office: officeFilter === "All offices" ? "Head Office" : officeFilter,
      fuel: "—",
      status: "Available"
    });
    setCompany("");
    setShowAdd(false);
    announce(`${name} added to service providers.`);
  };
  const changeEditingVehicle = (patch: Partial<VehicleRecord>) => setEditingVehicle(current=>current?{...current,...patch}:current);
  const saveVehicleEdits = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if(!editingVehicle) return;
    const name = (editingVehicle.company ?? editingVehicle.registration).trim();
    if (!name) return;
    onUpdate(editingVehicle.id, { ...editingVehicle, company: name, registration: name });
    announce(`${name} details updated.`);
    setEditingVehicle(null);
  };
  return <><PageTitle eyebrow="ADMIN FLEET CONTROL" title="Service providers" subtitle="Add service providers and manage availability for trip planning and emergency replacements." action={<button className="primary" onClick={()=>setShowAdd(value=>!value)}>{showAdd?"× Cancel":"＋ Add service provider"}</button>} />
    <section className="vehicle-metrics"><article><span>Total providers</span><strong>{visible.length}</strong></article><article><span>Available</span><strong>{visible.filter(item=>item.status==="Available").length}</strong></article><article><span>Out of service</span><strong>{visible.filter(item=>item.status==="Out of service").length}</strong></article></section>
    {showAdd && <form className="panel vehicle-add-form" onSubmit={addVehicle}><div className="panel-head"><div><h2>Add new service provider</h2><p>The service provider becomes available immediately in Trip Planning.</p></div><Status tone="blue">NEW SERVICE PROVIDER</Status></div><div className="vehicle-form-grid"><label className="wide"><span>Service provider name *</span><input value={company} onChange={event=>setCompany(event.target.value)} placeholder="Example: Kangaroo Cabs / Malkey Rent A Car" required autoFocus /></label></div><div className="vehicle-form-actions"><button className="secondary" type="button" onClick={()=>setShowAdd(false)}>Cancel</button><button className="primary" type="submit">Save service provider</button></div></form>}
    <section className="panel vehicle-register"><div className="panel-head"><div><h2>Service provider register</h2><p>Only Available service providers can be selected for a new trip or breakdown replacement.</p></div><select aria-label="Service provider office filter" value={officeFilter} disabled={!canViewAll} onChange={event=>setOfficeFilter(event.target.value)}>{canViewAll&&<option>All offices</option>}{offices.map(item=><option key={item}>{item}</option>)}</select></div><div className="vehicle-card-grid">{visible.map(vehicle=>{const name=vehicle.company||vehicle.registration;const initials=name.split(/\s+/).slice(0,2).map(w=>w[0]).join("").toUpperCase()||"SP";return <article key={vehicle.id}><div className="vehicle-card-top"><span>{initials}</span><div><strong>{name}</strong><p>Registered transport partner</p></div><div className="vehicle-card-controls"><Status tone={vehicle.status==="Available"?"green":"red"}>{vehicle.status}</Status><button onClick={()=>setEditingVehicle({...vehicle})}>Edit provider</button></div></div><label><span>Provider status</span><select value={vehicle.status} onChange={event=>onUpdate(vehicle.id,{status:event.target.value as VehicleStatus})}><option>Available</option><option>Out of service</option></select></label></article>;})}</div></section>
    {editingVehicle && <div className="vehicle-edit-backdrop" role="dialog" aria-modal="true" aria-label={`Edit ${editingVehicle.company || editingVehicle.registration}`}><form className="vehicle-edit-dialog" onSubmit={saveVehicleEdits}><header><div><p className="eyebrow">SERVICE PROVIDER RECORD</p><h2>Edit service provider</h2><span>Update the service provider details used across trip planning.</span></div><button type="button" aria-label="Close service provider editor" onClick={()=>setEditingVehicle(null)}>×</button></header><div className="vehicle-form-grid"><label className="wide"><span>Service provider name *</span><input value={editingVehicle.company ?? editingVehicle.registration} onChange={event=>changeEditingVehicle({company:event.target.value,registration:event.target.value})} required /></label><label className="wide"><span>Provider status *</span><select value={editingVehicle.status} onChange={event=>changeEditingVehicle({status:event.target.value as VehicleStatus})}><option>Available</option><option>Out of service</option></select></label></div><footer><button className="secondary" type="button" onClick={()=>setEditingVehicle(null)}>Cancel</button><button className="primary" type="submit">Save provider changes</button></footer></form></div>}
  </>;
}

function Reports({ requests, office, offices, canViewAll }: { requests: RequestItem[]; office: string; offices: string[]; canViewAll: boolean }) {
  const [officeFilter, setOfficeFilter] = useState(canViewAll ? "All offices" : office);
  const today = new Date();
  const [period,setPeriod] = useState<"month"|"year">("month");
  const [selectedMonth,setSelectedMonth] = useState(today.getMonth() + 1);
  const [selectedYear,setSelectedYear] = useState(today.getFullYear());
  const [statusFilter,setStatusFilter] = useState("All statuses");
  const [routeFilter,setRouteFilter] = useState("All routes");
  const [vehicleTypeFilter,setVehicleTypeFilter] = useState("All vehicle types");
  const [budgetFilter,setBudgetFilter] = useState("All budget codes");
  const [selectedReport,setSelectedReport] = useState<RequestItem | null>(null);
  const officeRequests = officeFilter === "All offices" ? requests : requests.filter(item => officeForRequest(item) === officeFilter);
  const years = [...new Set(requests.map(item=>parseReportDate(item.date)?.getFullYear()).filter((value): value is number=>Boolean(value)))].sort((a,b)=>b-a);
  if (!years.includes(today.getFullYear())) years.unshift(today.getFullYear());
  const routes = [...new Set(officeRequests.map(item=>item.route).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
  const vehicleTypes = [...new Set(officeRequests.map(item=>item.vehicleType ?? item.vehicle?.split(" · ")[1]).filter((value): value is string=>Boolean(value)))].sort((a,b)=>a.localeCompare(b));
  const budgetCodes = [...new Set(officeRequests.map(item=>item.budget).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
  const periodRequests = officeRequests.filter(item=>{const date=parseReportDate(item.date);return Boolean(date)&&date!.getFullYear()===selectedYear&&(period==="year"||date!.getMonth()+1===selectedMonth);});
  const scopedRequests = periodRequests.filter(item=>(statusFilter==="All statuses"||item.status===statusFilter)&&(routeFilter==="All routes"||item.route===routeFilter)&&(vehicleTypeFilter==="All vehicle types"||(item.vehicleType ?? item.vehicle?.split(" · ")[1])===vehicleTypeFilter)&&(budgetFilter==="All budget codes"||item.budget===budgetFilter));
  const approved = scopedRequests.filter(item => item.status === "Approved" || item.status === "Completed").length;
  const scheduled = scopedRequests.filter(item => item.status === "Trip scheduled").length;
  const attention = scopedRequests.filter(item => item.status === "Awaiting approval" || item.status === "Needs revision").length;
  const completedTrips = scopedRequests.filter(item => item.status === "Completed");
  const totalMileage = completedTrips.reduce((total,item) => total + (item.mileageKm ?? 0),0);
  const totalPrice = completedTrips.reduce((total,item) => total + (item.finalPriceLkr ?? 0),0);
  const completionRate = scopedRequests.length ? Math.round(((approved + scheduled) / scopedRequests.length) * 100) : 0;
  const chartValues = [attention,approved,scheduled,completedTrips.length];
  const chartMaximum = Math.max(1,...chartValues);
  const periodLabel = period === "month" ? new Date(selectedYear,selectedMonth-1,1).toLocaleDateString("en-GB",{month:"long",year:"numeric"}) : String(selectedYear);
  const exportReport = () => {
    const rows: HiringVehicleRegisterRow[] = completedTrips.map(item=>{const route=reportRouteParts(item);return {invoiceNo:item.receiptRef ?? item.tripId ?? (item.id.includes("-")?`TR-${item.id.split("-").pop()}`:item.id),date:parseReportDate(item.date),returnDate:parseReportDate(item.returnDate ?? item.completedAt ?? item.date),timeOut:item.time,timeIn:item.returnTime ?? "Not recorded",from:route.from,to:route.to,vehicleNo:item.vehicleCompany ?? item.vehicle?.split(" · ")[0] ?? "Not recorded",vehicleType:item.vehicleType ?? item.vehicle?.split(" · ")[1] ?? "Not recorded",purpose:item.purpose ?? "Not recorded",budgetCode:item.budget,totalKm:item.mileageKm ?? 0,totalAmount:item.finalPriceLkr ?? 0,passengers:(item.passengers?.length?item.passengers:[item.person]).join(", "),remarks:[item.completionNotes,item.adminNotes].filter(Boolean).join(" · ")||"",paymentUpdates:item.receiptRef?`Receipt / voucher: ${item.receiptRef}`:"Not recorded"};});
    const officeLabel = officeFilter === "All offices" ? "All Offices" : officeFilter.replace(" Area Office", " Office");
    const filename = `Hiring-vehicle-register-${officeLabel.toLowerCase().replaceAll(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}-${periodLabel.toLowerCase().replaceAll(" ","-")}.xlsx`;
    downloadHiringVehicleRegister(filename,{title:`${officeLabel} - Hiring Vehicle Movement Register`,periodLabel,rows});
    announce(`${periodLabel} hiring vehicle register downloaded as Excel.`);
  };
  return <><PageTitle eyebrow="MANAGEMENT INFORMATION" title="Reports & status" subtitle={canViewAll ? "Colombo administration overview across every office." : `Restricted to ${office} records only.`} action={<button className="primary" onClick={exportReport}>Download Excel register <span>↓</span></button>} />
    <section className={`scope-notice ${canViewAll ? "all-scope" : ""}`}><span>{canViewAll ? "◎" : "⌂"}</span><div><strong>{canViewAll ? "All-office access" : "Office-restricted access"}</strong><p>{canViewAll ? "Colombo Head Office Admin can review all branches or narrow the report to one office." : `You can only view requests, status and reports belonging to ${office}.`}</p></div><b>{canViewAll ? "COLOMBO ADMIN" : office.toUpperCase()}</b></section>
    <div className="report-toolbar"><div className="report-period-controls"><div className="filter-group"><button className={`filter ${period==="month"?"active":""}`} onClick={()=>setPeriod("month")}>Monthly</button><button className={`filter ${period==="year"?"active":""}`} onClick={()=>setPeriod("year")}>Yearly</button></div><select aria-label="Report year" value={selectedYear} onChange={event=>setSelectedYear(Number(event.target.value))}>{years.map(year=><option key={year} value={year}>{year}</option>)}</select>{period==="month"&&<select aria-label="Report month" value={selectedMonth} onChange={event=>setSelectedMonth(Number(event.target.value))}>{Array.from({length:12},(_,index)=><option key={index+1} value={index+1}>{new Date(2026,index,1).toLocaleDateString("en-GB",{month:"long"})}</option>)}</select>}<strong>{periodLabel}</strong></div><div className="report-filter-controls"><select aria-label="Report office" value={officeFilter} disabled={!canViewAll} onChange={event => setOfficeFilter(event.target.value)}>{canViewAll && <option>All offices</option>}{offices.map(item=><option key={item}>{item}</option>)}</select><select aria-label="Report status" value={statusFilter} onChange={event=>setStatusFilter(event.target.value)}><option>All statuses</option>{requestStatuses.map(status => <option key={status}>{status}</option>)}</select><select aria-label="Report route" value={routeFilter} onChange={event=>setRouteFilter(event.target.value)}><option>All routes</option>{routes.map(route=><option key={route} value={route}>{route}</option>)}</select><select aria-label="Report vehicle type" value={vehicleTypeFilter} onChange={event=>setVehicleTypeFilter(event.target.value)}><option>All vehicle types</option>{vehicleTypes.map(type=><option key={type}>{type}</option>)}</select><select aria-label="Report budget code" value={budgetFilter} onChange={event=>setBudgetFilter(event.target.value)}><option>All budget codes</option>{budgetCodes.map(code=><option key={code}>{code}</option>)}</select></div></div>
    <section className="metric-grid reports"><article className="metric-card"><span>Total requests</span><strong>{scopedRequests.length}</strong><p>Within the permitted office scope</p></article><article className="metric-card"><span>Completed trips</span><strong>{completedTrips.length}</strong><p><b className="up">Closed by Admin</b></p></article><article className="metric-card"><span>Total mileage</span><strong>{totalMileage.toLocaleString()} <small>km</small></strong><p>Actual completed-trip mileage</p></article><article className="metric-card"><span>Full trip cost</span><strong><small>LKR</small> {totalPrice.toLocaleString()}</strong><p>Trip, highway, per diem and other costs combined</p></article></section>
    <div className="reports-grid"><article className="panel chart-panel"><div className="panel-head"><div><h2>Request status picture</h2><p>{officeFilter} · visible records only</p></div><div className="legend"><span><i className="pink-dot"/>Requests</span><span><i className="navy-dot"/>Progress</span></div></div><div className="chart"><div className="axis"><span>100%</span><span>66%</span><span>33%</span><span>0</span></div>{[["Pending",attention],["Approved",approved],["Scheduled",scheduled],["Completed",completedTrips.length]].map(([label,value],index)=>{const count=Number(value);const requestHeight=count ? Math.max(8,(count/chartMaximum)*100) : 0;const progressHeight=count ? Math.max(6,Math.min(100,((count+index*.35)/chartMaximum)*88)) : 0;return <div className="bar-group" key={String(label)}><div><i style={{height:`${requestHeight}%`}}/><b style={{height:`${progressHeight}%`}}/></div><span>{label}</span></div>})}</div></article><article className="panel efficiency-panel"><div className="panel-head"><div><h2>Workflow progress</h2><p>Approved and scheduled share</p></div></div><div className="donut" style={{background:`conic-gradient(var(--pink) 0 ${completionRate}%,#edf0f3 ${completionRate}% 100%)`}}><div><strong>{completionRate}%</strong><span>progress</span></div></div><div className="efficiency-stats"><p><span>Visible requests</span><strong>{scopedRequests.length}</strong></p><p><span>Needs attention</span><strong>{attention}</strong></p><p><span>Completed</span><strong>{completedTrips.length}</strong></p></div></article></div>
    <article className="panel report-table"><div className="panel-head"><div><h2>{periodLabel} completed trip register</h2><p>{completedTrips.length} matching trip{completedTrips.length===1?"":"s"}. The Excel file follows the Colombo hiring vehicle register layout.</p></div><button className="secondary" onClick={exportReport}>Download .xlsx register</button></div><div className="table-scroll"><table><thead><tr><th>Trip</th><th>Request</th><th>Office / route</th><th>Completed</th><th>Mileage</th><th>Full cost</th><th>Receipt</th><th>Individual report</th></tr></thead><tbody>{completedTrips.length ? completedTrips.map(item=><tr key={item.id}><td><strong>{item.id.includes("-") ? `TR-${item.id.split("-").pop()}` : (item.tripId ?? "—")}</strong></td><td>{item.id}<small>{item.person}</small></td><td>{officeForRequest(item)}<small>{item.route}</small></td><td>{item.completedAt ?? "—"}</td><td><strong>{(item.mileageKm ?? 0).toLocaleString()} km</strong></td><td><strong>LKR {(item.finalPriceLkr ?? 0).toLocaleString()}</strong></td><td>{item.receiptRef ?? "—"}</td><td><button className="individual-report-button" onClick={()=>setSelectedReport(item)}>Full PDF report</button></td></tr>) : <tr><td colSpan={8}><div className="report-empty"><strong>No completed trips for these filters</strong><span>Choose another month, year, office, route, vehicle type or budget code.</span></div></td></tr>}</tbody></table></div></article>
    {selectedReport && (() => { const staff = staffMembers.find(member => member.empNo === selectedReport.requesterEmpNo) ?? staffMembers.find(member => member.name === selectedReport.person); const value = (entry?: string | number) => entry === undefined || entry === "" ? "Not recorded" : String(entry); const dateTime = (entry?: string) => { if (!entry) return "Not recorded"; const parsed = new Date(entry); return Number.isNaN(parsed.getTime()) ? entry : parsed.toLocaleString("en-GB",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit",hour12:true}); }; return <div className="trip-report-backdrop" role="dialog" aria-modal="true" aria-label={`Completed trip report ${selectedReport.id}`}>
      <div className="trip-report-window"><div className="trip-report-actions"><button className="secondary" onClick={()=>setSelectedReport(null)}>← Back to reports</button><button className="primary" onClick={()=>window.print()}>Print / Save PDF</button></div>
      <article className="trip-report-sheet"><div className="report-diagonal-watermark" aria-hidden="true">CHRYSALIS</div><header><div className="report-brand"><img src="/chrysalis-official.png" alt="Chrysalis — Catalyzing change"/></div><div><p>COMPLETED TRIP REPORT</p><span>Generated for administration and finance review</span></div><b>COMPLETED</b></header>
        <section className="report-reference compact"><div><span>Request reference</span><strong>{selectedReport.id}</strong></div><div><span>Trip reference</span><strong>{selectedReport.id.includes("-") ? `TR-${selectedReport.id.split("-").pop()}` : (selectedReport.tripId ?? "Not recorded")}</strong></div><div><span>Base office</span><strong>{officeForRequest(selectedReport)}</strong></div></section>
        <section className="report-section"><h2>01 · Requester / staff details</h2><dl className="report-details"><div><dt>Full name</dt><dd>{selectedReport.person}</dd></div><div><dt>Employee number</dt><dd>{value(selectedReport.requesterEmpNo ?? staff?.empNo)}</dd></div><div><dt>Position</dt><dd>{value(selectedReport.requesterPosition ?? staff?.position)}</dd></div><div><dt>Project / programme</dt><dd>{value(selectedReport.requesterProject ?? staff?.project)}</dd></div><div className="wide"><dt>Office</dt><dd>{officeForRequest(selectedReport)}</dd></div></dl></section>
        <section className="report-section"><h2>02 · Request and journey details</h2><dl className="report-details"><div><dt>Request date</dt><dd>{value(selectedReport.requestDate)}</dd></div><div><dt>Request type</dt><dd>{value(selectedReport.requestType)}</dd></div><div className="wide"><dt>Route</dt><dd>{selectedReport.route}</dd></div><div><dt>Travel date / departure</dt><dd>{selectedReport.date} · {selectedReport.time}</dd></div><div><dt>Return</dt><dd>{value(selectedReport.returnDate)} · {value(selectedReport.returnTime)}</dd></div><div><dt>Budget code</dt><dd>{selectedReport.budget}</dd></div><div><dt>Passengers</dt><dd>{selectedReport.passengers?.length ?? 1} traveller(s)</dd></div><div className="wide"><dt>Business purpose</dt><dd>{value(selectedReport.purpose)}</dd></div></dl>{selectedReport.passengers?.length ? <div className="report-passengers"><span>Passenger list</span><p>{selectedReport.passengers.join(" · ")}</p></div> : null}</section>
        <section className="report-section"><h2>03 · Approval</h2><dl className="report-details"><div><dt>Approved by</dt><dd>{value(selectedReport.approvedBy)}</dd></div><div><dt>Approval date / time</dt><dd>{dateTime(selectedReport.approvedAt)}</dd></div><div><dt>Arranged by</dt><dd>{value(selectedReport.completedBy)}</dd></div><div><dt>Vehicle dispatched</dt><dd>{dateTime(selectedReport.dispatchedAt)}</dd></div><div><dt>Service provider</dt><dd>{value(selectedReport.vehicleCompany ?? selectedReport.vehicle?.split(" · ")[0])}</dd></div><div><dt>Vehicle type</dt><dd>{value(selectedReport.vehicleType ?? selectedReport.vehicle?.split(" · ")[1])}</dd></div><div className="wide"><dt>Admin notes</dt><dd>{value(selectedReport.adminNotes)}</dd></div></dl></section>
        {selectedReport.incidents?.length ? <section className="report-section"><h2>04 · Mid-trip incident and vehicle replacement</h2><div className="report-incident-list">{selectedReport.incidents.map(incident=><article key={incident.id}><div className="report-incident-title"><strong>{incident.id}</strong><span>{incident.recordedAt} · {incident.location}</span></div><dl className="report-details"><div className="wide"><dt>Fault / incident</dt><dd>{incident.issue}</dd></div><div><dt>Original vehicle</dt><dd>{incident.originalVehicle}</dd></div><div><dt>Original driver</dt><dd>{incident.originalDriver}</dd></div><div><dt>Replacement vehicle</dt><dd>{incident.replacementVehicle}</dd></div><div><dt>Replacement driver</dt><dd>{incident.replacementDriver}</dd></div><div><dt>Recorded by</dt><dd>{incident.recordedBy}</dd></div><div><dt>Recorded date / time</dt><dd>{incident.recordedAt}</dd></div><div className="wide"><dt>Action taken</dt><dd>{value(incident.actionTaken)}</dd></div></dl></article>)}</div></section> : null}
        <section className="report-section report-actuals"><h2>{selectedReport.incidents?.length ? "05" : "04"} · Completion and actual cost</h2><div className="report-total"><div><span>Actual mileage</span><strong>{(selectedReport.mileageKm ?? 0).toLocaleString()} km</strong></div><div><span>Full trip cost</span><strong>LKR {(selectedReport.finalPriceLkr ?? 0).toLocaleString()}</strong></div></div><dl className="report-details"><div><dt>Invoice date</dt><dd>{value(selectedReport.completedAt)}</dd></div><div><dt>Receipt / voucher</dt><dd>{value(selectedReport.receiptRef)}</dd></div><div className="wide"><dt>Completion notes</dt><dd>{value(selectedReport.completionNotes)}</dd></div></dl></section>
        <footer className="report-watermark"><p className="system-generated-notice">This report is system-generated and does not require signatures.</p></footer>
      </article></div></div>; })()}
  </>;
}

function RootSettings({ users, requests, vehicles, offices, onAddUser, onAddOffice, onRemoveOffice, onUpdateUser, onUpdateRequest }: {
  users: UserRecord[];
  requests: RequestItem[];
  vehicles: VehicleRecord[];
  offices: string[];
  onAddUser: (user: UserRecord) => void;
  onAddOffice: (office: string) => void;
  onRemoveOffice: (office: string, replacementOffice: string) => void;
  onUpdateUser: (id: string, patch: Partial<UserRecord>) => void;
  onUpdateRequest: (id: string, patch: Partial<RequestItem>) => void;
}) {
  const [tab, setTab] = useState<AdminTab>("people");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<Role>("user");
  const [newOffice, setNewOffice] = useState("Head Office");
  const [officeName,setOfficeName] = useState("");
  const [officeToRemove,setOfficeToRemove] = useState<string | null>(null);
  const [replacementOffice,setReplacementOffice] = useState("Head Office");
  const visibleUsers = users.filter(user => `${user.name} ${user.email} ${roleConfig[user.role].label}`.toLowerCase().includes(search.toLowerCase()));
  const managers = users.filter(user => user.role === "project_manager" && user.active);
  const directors = users.filter(user => user.role === "project_director" && user.active);
  const ceos = users.filter(user => user.role === "ceo" && user.active);
  const operationsHeads = users.filter(user => user.role === "head_operations" && user.active);

  const addPerson = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onAddUser({ id: `USR-${String(Date.now()).slice(-6)}`, name: newName.trim(), email: newEmail.trim(), authEmail: newEmail.trim(), role: newRole, office: newOffice, active: true });
    setNewName(""); setNewEmail(""); setNewRole("user"); setShowAdd(false);
  };
  const addOffice = (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); const name=officeName.trim(); if (!name) return; onAddOffice(name); setOfficeName(""); };
  const openOfficeRemoval = (office: string) => { setOfficeToRemove(office); setReplacementOffice(offices.find(item=>item!==office) ?? "Head Office"); };
  const confirmOfficeRemoval = () => { if (!officeToRemove || officeToRemove === "Head Office" || !replacementOffice || replacementOffice === officeToRemove) return; onRemoveOffice(officeToRemove,replacementOffice); setOfficeToRemove(null); };
  const officeUsage = officeToRemove ? {
    users: users.filter(item=>item.office===officeToRemove).length,
    requests: requests.filter(item=>officeForRequest(item)===officeToRemove).length,
    vehicles: vehicles.filter(item=>item.office===officeToRemove).length,
  } : { users:0, requests:0, vehicles:0 };

  return <>
    <PageTitle eyebrow="ROOT SYSTEM ADMINISTRATION" title="People, access & request control" subtitle="Super Admin has full authority across users, approval routing and every vehicle request." action={<span className="root-badge">ROOT ACCESS</span>} />
    <section className="root-access-banner"><span>✦</span><div><strong>Full system control enabled</strong><p>Add any account type, change access levels, manage approval routing and correct any request record.</p></div><small>SUPER ADMIN ONLY</small></section>
    <div className="admin-tabs" role="tablist" aria-label="Administration sections">
      <button role="tab" aria-selected={tab === "people"} className={tab === "people" ? "active" : ""} onClick={() => setTab("people")}>People & access <b>{users.length}</b></button>
      <button role="tab" aria-selected={tab === "routing"} className={tab === "routing" ? "active" : ""} onClick={() => setTab("routing")}>Approval routing</button>
      <button role="tab" aria-selected={tab === "requests"} className={tab === "requests" ? "active" : ""} onClick={() => setTab("requests")}>All requests <b>{requests.length}</b></button>
    </div>

    {tab === "people" && <section className="panel root-panel">
      <div className="panel-head admin-panel-head"><div><h2>Organisation users</h2><p>Manage Requesters, Project Managers, Project Directors, Admins and Super Admins.</p></div><div className="admin-head-actions"><label className="search"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg><input aria-label="Search all users" placeholder="Search people" value={search} onChange={event => setSearch(event.target.value)} /></label><button className="primary" onClick={() => setShowAdd(value => !value)}>＋ Add person</button></div></div>
      {showAdd && <form className="add-person-form" onSubmit={addPerson}><label><span>Full name</span><input value={newName} onChange={event => setNewName(event.target.value)} required /></label><label><span>Work email</span><input type="email" value={newEmail} onChange={event => setNewEmail(event.target.value)} required /></label><label><span>Access role</span><select value={newRole} onChange={event => setNewRole(event.target.value as Role)}>{editableRoles.map(item => <option key={item} value={item}>{roleConfig[item].label}</option>)}</select></label><label><span>Office</span><select value={newOffice} onChange={event => setNewOffice(event.target.value)}>{offices.map(item=><option key={item}>{item}</option>)}</select></label><button className="primary" type="submit">Create account</button><button className="secondary" type="button" onClick={() => setShowAdd(false)}>Cancel</button></form>}
      <div className="user-directory"><div className="directory-head"><span>Person & sign-in email</span><span>Access role</span><span>Office</span><span>Status</span></div>{visibleUsers.map((user,index) => <div className="directory-row" key={user.id}><div className="directory-person"><span className={`avatar ${index % 2 ? "blue" : "pink"}`}>{user.name.split(" ").map(word => word[0]).slice(0,2).join("")}</span><span><strong>{user.name}</strong><small>{user.actingFor ? `Acting ${user.actingFor} · ` : ""}{user.position ?? user.email} · {user.id}</small><input key={user.authEmail ?? "unassigned"} className="directory-login-email" type="email" aria-label={`Login email for ${user.name}`} defaultValue={user.authEmail ?? ""} disabled={user.protected} placeholder="Assign exact login email" onBlur={event => { const next = event.currentTarget.value.trim().toLowerCase(); if (next !== (user.authEmail ?? "")) { onUpdateUser(user.id,{authEmail:next || undefined}); announce(next ? `Login email assigned to ${user.name}` : `Login email removed for ${user.name}`); } }} /></span></div><select aria-label={`Role for ${user.name}`} value={user.role} disabled={user.protected} onChange={event => { const nextRole=event.target.value as Role; onUpdateUser(user.id,{role:nextRole,displayRole:nextRole,displayTitle:undefined,actingFor:undefined,accessOverride:true}); }}>{editableRoles.map(item => <option key={item} value={item}>{roleConfig[item].label}</option>)}</select><select aria-label={`Office for ${user.name}`} value={user.office} onChange={event => onUpdateUser(user.id,{office:event.target.value})}>{offices.map(item=><option key={item}>{item}</option>)}</select><div className="directory-status">{user.protected ? <span className="root-owner">Root owner</span> : <button className={`access-switch ${user.active ? "active" : ""}`} onClick={() => onUpdateUser(user.id,{active:!user.active})}><i />{user.active ? "Active" : "Disabled"}</button>}</div></div>)}</div>
      <section className="office-management"><div><p className="eyebrow">OFFICE MANAGEMENT</p><h3>Organisation offices</h3><p>Add an office once and use it across users, requests, Admin scope and reports.</p></div><form onSubmit={addOffice}><label><span>New office name</span><input value={officeName} onChange={event=>setOfficeName(event.target.value)} placeholder="Example: Jaffna Area Office" required /></label><button className="primary" type="submit">＋ Add office</button></form><div className="office-chip-list">{offices.map((item,index)=><span key={item}><b>{index+1}</b><em>{item}</em>{item === "Head Office" ? <i title="Protected office">◆</i> : <button type="button" aria-label={`Remove ${item}`} onClick={()=>openOfficeRemoval(item)}>×</button>}</span>)}</div></section>
      {officeToRemove && <div className="office-delete-backdrop" role="dialog" aria-modal="true" aria-label={`Remove ${officeToRemove}`}><section className="office-delete-dialog"><header><span>!</span><div><p className="eyebrow">OFFICE REMOVAL</p><h2>Remove {officeToRemove}?</h2><p>The office will be removed after all linked records are safely reassigned.</p></div></header><div className="office-delete-usage"><div><strong>{officeUsage.users}</strong><span>Users</span></div><div><strong>{officeUsage.requests}</strong><span>Requests</span></div><div><strong>{officeUsage.vehicles}</strong><span>Vehicles</span></div></div><label><span>Move linked records to</span><select value={replacementOffice} onChange={event=>setReplacementOffice(event.target.value)}>{offices.filter(item=>item!==officeToRemove).map(item=><option key={item}>{item}</option>)}</select></label><p className="office-delete-warning">This changes the office on every linked user, request and vehicle. The action is synchronized to all authorized users.</p><footer><button type="button" className="secondary" onClick={()=>setOfficeToRemove(null)}>Cancel</button><button type="button" className="danger" onClick={confirmOfficeRemoval}>Remove office & reassign</button></footer></section></div>}
    </section>}

    {tab === "routing" && <div className="routing-root-grid">
      <section className="panel root-panel"><div className="panel-head"><div><h2>Project Managers</h2><p>First-level budget approval accounts</p></div><Status tone="green">{managers.length} active</Status></div>{managers.map(user => <div className="person-row" key={user.id}><span className="avatar pink">{user.name.split(" ").map(word=>word[0]).slice(0,2).join("")}</span><div><strong>{user.name}</strong><p>{user.email} · {user.office}</p></div><Status tone="green">Active</Status></div>)}</section>
      <section className="panel root-panel"><div className="panel-head"><div><h2>Project Directors</h2><p>Project Manager request approval</p></div><Status tone="blue">{directors.length} active</Status></div>{directors.map(user => <div className="person-row" key={user.id}><span className="avatar blue">{user.name.split(" ").map(word=>word[0]).slice(0,2).join("")}</span><div><strong>{user.name}</strong><p>{user.email} · {user.office}</p></div><Status tone="green">Active</Status></div>)}</section>
      <section className="panel root-panel"><div className="panel-head"><div><h2>CEO</h2><p>CHR budget, Project Director and HOD request approval</p></div><Status tone="blue">{ceos.length} active</Status></div>{ceos.map(user => <div className="person-row" key={user.id}><span className="avatar blue">{user.name.split(" ").map(word=>word[0]).slice(0,2).join("")}</span><div><strong>{user.name}</strong><p>{user.email} · Executive Office</p></div><Status tone="green">Active</Status></div>)}</section>
      <section className="panel root-panel"><div className="panel-head"><div><h2>Head of Operations</h2><p>Colombo Admin operational approval</p></div><Status tone="blue">{operationsHeads.length} active</Status></div>{operationsHeads.map(user => <div className="person-row" key={user.id}><span className="avatar blue">{user.name.split(" ").map(word=>word[0]).slice(0,2).join("")}</span><div><strong>{user.name}</strong><p>{user.email} · Head Office</p></div><Status tone="green">Active</Status></div>)}</section>
      <section className="panel routing-map-full"><div className="panel-head"><div><h2>Approval chain mapping</h2><p>Approved requests are released to Admin operations.</p></div></div>
        <div className="mapping"><span><small>CHR BUDGET CODE</small><strong>CHR-funded requests</strong></span><i>→</i><span><small>CEO</small><strong>Approve → Admin</strong></span></div>
        <div className="mapping"><span><small>PROJECT DIRECTOR / HOD</small><strong>Their own travel requests</strong></span><i>→</i><span><small>CEO</small><strong>Approve → Admin</strong></span></div>
        <div className="mapping"><span><small>COLOMBO ADMIN</small><strong>Head Office requests</strong></span><i>→</i><span><small>HEAD OF OPERATIONS</small><strong>Approve → Admin operations</strong></span></div>
        {managers.map((manager,index) => <div className="mapping" key={manager.id}><span><small>PROJECT MANAGER</small><strong>{manager.name}</strong></span><i>→</i><span><small>PROJECT DIRECTOR</small><select aria-label={`Director for ${manager.name}`} defaultValue={directors[index % Math.max(directors.length,1)]?.id}>{directors.map(director => <option key={director.id} value={director.id}>{director.name}</option>)}</select></span></div>)}
      </section>
    </div>}

{tab === "requests" && <section className="panel root-panel request-control-panel"><div className="panel-head"><div><h2>Root request register</h2><p>Edit every field and workflow status. Changes sync to every authorized user.</p></div><span className="edit-live"><i /> LIVE EDIT</span></div><div className="root-request-list">{requests.map(item => <article className="root-request-card" key={item.id}><div className="root-request-id"><strong>{item.id}</strong><Status tone={item.tone}>{item.status}</Status></div><div className="root-request-fields"><label><span>Requester</span><input value={item.person} onChange={event => onUpdateRequest(item.id,{person:event.target.value})} /></label><label><span>Route</span><input value={item.route} onChange={event => onUpdateRequest(item.id,{route:event.target.value})} /></label><label><span>Travel date</span><input value={item.date} onChange={event => onUpdateRequest(item.id,{date:event.target.value})} /></label><label><span>Departure</span><input type="time" value={item.time} onChange={event => onUpdateRequest(item.id,{time:event.target.value})} /></label><label><span>Budget code</span><input value={item.budget} onChange={event => onUpdateRequest(item.id,{budget:event.target.value})} /></label><label><span>Office access scope</span><select value={officeForRequest(item)} onChange={event => onUpdateRequest(item.id,{office:event.target.value})}>{offices.map(office=><option key={office}>{office}</option>)}</select></label><label><span>Workflow status</span><select value={item.status} onChange={event => onUpdateRequest(item.id,{status:event.target.value,tone:toneForStatus(event.target.value)})}>{requestStatuses.map(status => <option key={status}>{status}</option>)}</select></label><label className="request-purpose-edit"><span>Purpose / admin note</span><input value={item.purpose ?? ""} placeholder="Add purpose or correction note" onChange={event => onUpdateRequest(item.id,{purpose:event.target.value})} /></label></div></article>)}</div></section>}
  </>;
}

export default function Workspace({ viewerEmail, viewerName }: { viewerEmail: string; viewerName: string }) {
  const { signOut } = useClerk();
  const [role, setRole] = useState<Role | null>(null);
  const [displayRole, setDisplayRole] = useState<Role | null>(null);
  const [displayTitle, setDisplayTitle] = useState<string | undefined>();
  const [view, setView] = useState<View>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [requests, setRequests] = useState<RequestItem[]>(initialRequests);
  const [users, setUsers] = useState<UserRecord[]>(initialUsers);
  const [offices,setOffices] = useState(initialOffices);
  const [vehicles,setVehicles] = useState<VehicleRecord[]>(initialVehicles);
  const [conversations,setConversations] = useState<DirectConversation[]>([]);
  const [adminOffice, setAdminOffice] = useState("Head Office");
  const [currentStaff, setCurrentStaff] = useState<StaffMember | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [searchOpen,setSearchOpen] = useState(false);
  const [notificationsOpen,setNotificationsOpen] = useState(false);
  const [searchQuery,setSearchQuery] = useState("");
  const [notice,setNotice] = useState("");
  const [readNotificationIds,setReadNotificationIds] = useState<string[]>([]);
  const [desktopAlertPermission,setDesktopAlertPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  const [syncStatus,setSyncStatus] = useState<SyncStatus>("connecting");
  const [sharedReady,setSharedReady] = useState(false);
  const [accessError,setAccessError] = useState("");
  const revisionRef = useRef(0);
  const applyingRemoteRef = useRef(false);
  const savingRef = useRef(false);
  const lastSavedStateRef = useRef("");

  useEffect(() => {
    const restore = window.setTimeout(() => {
      const savedReadNotifications = window.localStorage.getItem("chrysalis-read-notifications");
      if (savedReadNotifications) { try { setReadNotificationIds(JSON.parse(savedReadNotifications) as string[]); } catch { window.localStorage.removeItem("chrysalis-read-notifications"); } }
      setDesktopAlertPermission("Notification" in window ? Notification.permission : "unsupported");
    }, 0);
    return () => window.clearTimeout(restore);
  }, []);

  useEffect(() => {
    let active = true;
    const applyShared = (state: SharedState, membership: Membership, firstLoad = false) => {
      applyingRemoteRef.current = true;
      setRequests(state.requests.map(item => ({ ...item, office: officeForRequest(item), awaitingRole: item.awaitingRole ?? "project_manager" })));
      setUsers(state.users);
      setOffices(state.offices);
      setVehicles(state.vehicles);
      setConversations(state.conversations ?? []);
      setRole(membership.role);
      setDisplayRole(membership.displayRole ?? membership.role);
      setDisplayTitle(membership.displayTitle);
      setAdminOffice(membership.office);
      setCurrentStaff(staffMembers.find(member => member.empNo === membership.empNo || member.name === membership.name) ?? null);
      if (firstLoad) setView(roleConfig[membership.role].startView);
    };
    const loadSharedState = async () => {
      try {
        const response = await fetch("/api/state", { cache: "no-store" });
        const data = await response.json() as { state?: SharedState | null; revision?: number; membership?: Membership; error?: string };
        if (!response.ok) throw new Error(data.error ?? "Shared workspace unavailable");
        if (!active || !data.membership) return;
        if (data.state) {
          revisionRef.current = data.revision ?? 0;
          applyShared(data.state, data.membership, true);
        } else {
          const readCache = <T,>(key: string, fallback: T): T => {
            try { return JSON.parse(window.localStorage.getItem(key) ?? "") as T; } catch { return fallback; }
          };
          const cachedUsers = readCache<UserRecord[]>("chrysalis-users", initialUsers).map(user => user.id === "USR-001" ? { ...user, authEmail: "yenukaadarsha93@gmail.com", protected: true } : user);
          const seed: SharedState = {
            requests: readCache<RequestItem[]>("chrysalis-requests", initialRequests),
            users: [...cachedUsers, ...initialUsers.filter(seedUser => !cachedUsers.some(user => user.id === seedUser.id))],
            offices: [...new Set([...readCache<string[]>("chrysalis-offices", initialOffices), ...initialOffices])],
            vehicles: readCache<VehicleRecord[]>("chrysalis-vehicles", initialVehicles),
            conversations: [],
          };
          const saved = await fetch("/api/state", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ state: seed }) });
          const result = await saved.json() as { state?: SharedState; revision?: number; membership?: Membership; error?: string };
          if (!saved.ok || !result.state || !result.membership) throw new Error(result.error ?? "Unable to initialize shared workspace");
          revisionRef.current = result.revision ?? 0;
          applyShared(result.state, result.membership, true);
        }
        setSharedReady(true);
        setSyncStatus("synced");
      } catch (error) {
        if (active) { setAccessError(error instanceof Error ? error.message : "Access unavailable"); setSyncStatus("offline"); }
      }
    };
    void loadSharedState();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!sharedReady) return;
    if (applyingRemoteRef.current) { applyingRemoteRef.current = false; return; }
    const state: SharedState = { requests, users, offices, vehicles, conversations };
    const serialized = JSON.stringify(state);
    if (serialized === lastSavedStateRef.current) return;
    const timer = window.setTimeout(async () => {
      try {
        savingRef.current = true;
        setSyncStatus("saving");
        const response = await fetch("/api/state", { method: "PUT", headers: { "Content-Type": "application/json" }, body: serialized });
        const result = await response.json() as { state?: SharedState; revision?: number; membership?: Membership; error?: string };
        if (!response.ok) throw new Error(result.error ?? "Sync failed");
        revisionRef.current = result.revision ?? revisionRef.current;
        lastSavedStateRef.current = serialized;
        setSyncStatus("synced");
      } catch { setSyncStatus("offline"); }
      finally { savingRef.current = false; }
    }, 600);
    return () => window.clearTimeout(timer);
  }, [requests, users, offices, vehicles, conversations, sharedReady]);

  useEffect(() => {
    if (!sharedReady) return;
    let pollFailures = 0;
    const poll = window.setInterval(async () => {
      if (savingRef.current) return;
      try {
        const response = await fetch("/api/state", { cache: "no-store" });
        const data = await response.json() as { state?: SharedState | null; revision?: number; membership?: Membership };
        if (!response.ok || !data.state || !data.membership) throw new Error("Sync unavailable");
        pollFailures = 0;
        if ((data.revision ?? 0) > revisionRef.current) {
          revisionRef.current = data.revision ?? revisionRef.current;
          lastSavedStateRef.current = JSON.stringify({
            requests: data.state.requests,
            users: data.state.users,
            offices: data.state.offices,
            vehicles: data.state.vehicles,
            conversations: data.state.conversations ?? [],
          });
          applyingRemoteRef.current = true;
          setRequests(data.state.requests);
          setUsers(data.state.users);
          setOffices(data.state.offices);
          setVehicles(data.state.vehicles);
          setConversations(data.state.conversations ?? []);
          setRole(data.membership.role);
          setDisplayRole(data.membership.displayRole ?? data.membership.role);
          setDisplayTitle(data.membership.displayTitle);
          setAdminOffice(data.membership.office);
        }
        setSyncStatus("synced");
      } catch {
        pollFailures++;
        if (pollFailures >= 3) {
          setSyncStatus("offline");
        }
      }
    }, 5000);
    return () => window.clearInterval(poll);
  }, [sharedReady]);

  useEffect(() => { window.localStorage.setItem("chrysalis-read-notifications", JSON.stringify(readNotificationIds)); }, [readNotificationIds]);
  useEffect(() => {
    if (!role || !("Notification" in window) || Notification.permission !== "granted") return;
    const activeAdmin = role === "admin" ? users.find(user => user.role === "admin" && user.active && user.office === adminOffice) : undefined;
    const activeName = role === "user" && currentStaff ? currentStaff.name : activeAdmin?.name ?? roleConfig[role].name;
    const activeOffice = role === "admin" ? adminOffice : role === "user" && currentStaff ? currentStaff.office : users.find(user => user.role === role && user.active)?.office ?? "Head Office";
    const items = notificationsFor(role, activeName, activeOffice, requests);
    const storageKey = `chrysalis-desktop-notified-${role}-${activeName}`;
    let notified: string[] = [];
    try { notified = JSON.parse(window.localStorage.getItem(storageKey) ?? "[]") as string[]; } catch { notified = []; }
    const next = items.find(item => !notified.includes(item.id));
    if (next) new Notification(next.title, { body: next.detail, icon: "/chrysalis-official.png", tag: next.id });
    window.localStorage.setItem(storageKey, JSON.stringify([...new Set([...notified, ...items.map(item => item.id)])].slice(-100)));
  }, [role, requests, users, adminOffice, currentStaff]);
  useEffect(() => {
    const showNotice = (event: Event) => { const message=(event as CustomEvent<string>).detail; setNotice(message); window.setTimeout(()=>setNotice(""),3200); };
    window.addEventListener("chrysalis:notice",showNotice);
    return () => window.removeEventListener("chrysalis:notice",showNotice);
  },[]);

  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const saved = typeof window !== "undefined" ? (localStorage.getItem("chrysalis-theme") as "light" | "dark" | null) : null;
    if (saved === "dark" || saved === "light") {
      setTheme(saved);
      document.documentElement.classList.toggle("theme-dark", saved === "dark");
    }
  }, []);

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === "dark" ? "light" : "dark";
      if (typeof window !== "undefined") {
        localStorage.setItem("chrysalis-theme", next);
      }
      if (typeof document !== "undefined") {
        document.documentElement.classList.toggle("theme-dark", next === "dark");
      }
      announce(`Switched to ${next} theme.`);
      return next;
    });
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(()=>undefined);
    void signOut({ redirectUrl: `${window.location.origin}/sign-in` });
  };

  const enableDesktopAlerts = async () => {
    if (!("Notification" in window)) { setDesktopAlertPermission("unsupported"); announce("Desktop alerts are not supported by this browser."); return; }
    const permission = await Notification.requestPermission();
    setDesktopAlertPermission(permission);
    announce(permission === "granted" ? "Desktop alerts are now enabled." : "Desktop alerts were not enabled. You can change this in browser settings.");
  };

  const updateRequest = (id: string, patch: Partial<RequestItem>) => setRequests(items => items.map(item => item.id === id ? { ...item, ...patch } : item));
  const createRequest = (request: RequestItem) => setRequests(items => [request, ...items]);
  const addUser = (user: UserRecord) => setUsers(items => [user, ...items]);
  const addOffice = (office: string) => setOffices(items => { if (items.some(item=>item.toLowerCase()===office.toLowerCase())) { announce("That office already exists."); return items; } announce(`${office} added to the organisation.`); return [...items,office]; });
  const removeOffice = (office: string, replacementOffice: string) => {
    if (office === "Head Office" || office === replacementOffice || !offices.includes(replacementOffice)) { announce("That office cannot be removed."); return; }
    setUsers(items=>items.map(item=>item.office===office?{...item,office:replacementOffice}:item));
    setRequests(items=>items.map(item=>officeForRequest(item)===office?{...item,office:replacementOffice}:item));
    setVehicles(items=>items.map(item=>item.office===office?{...item,office:replacementOffice}:item));
    setOffices(items=>items.filter(item=>item!==office));
    if (adminOffice===office) setAdminOffice(replacementOffice);
    announce(`${office} removed. Linked records moved to ${replacementOffice}.`);
  };
  const updateUser = (id: string, patch: Partial<UserRecord>) => setUsers(items => items.map(item => item.id === id ? { ...item, ...patch } : item));
  const addVehicle = (vehicle: VehicleRecord) => setVehicles(items => { if(items.some(item=>item.registration.toLowerCase()===vehicle.registration.toLowerCase())) { announce("That vehicle registration already exists."); return items; } announce(`${vehicle.registration} added to the fleet.`); return [vehicle,...items]; });
  const updateVehicle = (id: string, patch: Partial<VehicleRecord>) => { const current=vehicles.find(item=>item.id===id); if(!current) return; const updated={...current,...patch}; const oldLabel=vehicleLabel(current); const newLabel=vehicleLabel(updated); setVehicles(items=>items.map(item=>item.id===id?updated:item)); if(oldLabel!==newLabel) setRequests(items=>items.map(item=>item.vehicle===oldLabel?{...item,vehicle:newLabel}:item)); };

  const activeLabel = useMemo(() => navItems.find(item => item.id === view)?.label, [view]);
  const adminAccounts = users.filter(user => user.role === "admin" && user.active);
  if (accessError) return <main className="secure-gate"><section><div className="brand"><img className="official-logo" src="/chrysalis-official.png" alt="Chrysalis — Catalyzing change"/></div><span className="secure-lock">🔒</span><p className="eyebrow">SECURE WORKSPACE</p><h1>Access needs to be assigned</h1><p>{accessError}</p><small>Signed in as {viewerName || viewerEmail} · {viewerEmail}</small><button type="button" onClick={logout}>Sign in with another account</button></section></main>;
  if (!role) return <main className="secure-gate"><section><div className="brand"><img className="official-logo" src="/chrysalis-official.png" alt="Chrysalis — Catalyzing change"/></div><span className="secure-lock">↻</span><p className="eyebrow">SECURE WORKSPACE</p><h1>Connecting your account</h1><p>Loading the shared mobility workspace and your assigned role…</p><small>{viewerEmail}</small></section></main>;

  const baseAccount = roleConfig[role];
  const visibleRole = displayRole ?? role;
  const displayAccount = roleConfig[visibleRole];
  const activeAdmin = role === "admin" ? adminAccounts.find(admin => admin.office === adminOffice) : undefined;
  const signedInDirectoryUser = users.find(user => user.name === viewerName || (user.authEmail ?? "").toLowerCase() === viewerEmail.toLowerCase());
  const accountBase = { ...baseAccount, label: displayTitle ?? displayAccount.label };
  const account = role === "user" && currentStaff ? { ...accountBase, name: currentStaff.name, email: `EMP No: ${currentStaff.empNo}`, initials: currentStaff.name.split(" ").map(part => part[0]).slice(0,2).join("") } : signedInDirectoryUser ? { ...accountBase, name: signedInDirectoryUser.name, email: signedInDirectoryUser.authEmail ?? signedInDirectoryUser.email, initials: signedInDirectoryUser.name.split(" ").map(part => part[0]).slice(0,2).join("") } : activeAdmin ? { ...accountBase, name: activeAdmin.name, email: activeAdmin.email, initials: activeAdmin.name.split(" ").map(part => part[0]).slice(0,2).join("") } : accountBase;
  const updateStatus = (id: string, status: string, tone: string, comment?: string) => setRequests(items => items.map(item => item.id === id ? { ...item, status, tone, decisionComment:comment, decisionBy:account.name, decisionAt:new Date().toISOString(), ...(status === "Approved" ? { approvedBy: account.name, approvedAt: new Date().toISOString() } : {}) } : item));
  const allowedNav = navItems.filter(item => account.views.includes(item.id));
  const approvers = users.filter(user => user.active && (["project_manager", "project_director", "ceo", "head_operations"] as Role[]).includes(user.role));
  const accountOffice = role === "admin" ? (signedInDirectoryUser?.office ?? adminOffice) : role === "user" && currentStaff ? currentStaff.office : signedInDirectoryUser?.office ?? "Head Office";
  const canAccessReports = role === "admin" || role === "super_admin";
  const canViewAllOffices = role === "super_admin" || (role === "admin" && accountOffice === "Head Office");
  const visibleRequests = role === "admin" && !canViewAllOffices ? requests.filter(item => officeForRequest(item) === accountOffice) : requests;
  const visibleVehicles = role === "admin" && !canViewAllOffices ? vehicles.filter(item=>item.office===accountOffice) : vehicles;
  const approvedCalendarOnly = role === "user";
  const notificationItems = notificationsFor(role, account.name, accountOffice, requests);
  const unreadNotifications = notificationItems.filter(item => !readNotificationIds.includes(item.id));
  const openNotification = (item: NotificationItem) => { setReadNotificationIds(ids => [...new Set([...ids,item.id])]); navigate(item.view); setNotificationsOpen(false); };
  const markAllNotificationsRead = () => { setReadNotificationIds(ids => [...new Set([...ids,...notificationItems.map(item=>item.id)])]); announce("All notifications marked as read."); };
  const navigate = (nextView: View) => { if (account.views.includes(nextView)) { setView(nextView); setSidebarOpen(false); setSearchOpen(false); } else if (nextView === "approvals" && account.views.includes("trips")) { setView("trips"); setSidebarOpen(false); setSearchOpen(false); announce("Admin operational request queue opened."); } else announce(`${account.label} does not have access to ${navItems.find(item=>item.id===nextView)?.label ?? "this section"}.`); };
  const content = view === "dashboard" ? <Dashboard requests={visibleRequests} onNew={() => navigate("request")} onNavigate={navigate} /> : view === "calendar" ? <TripCalendar requests={role === "admin" ? visibleRequests : requests} currentUser={account.name} approvedOnly={approvedCalendarOnly} onNew={()=>navigate("request")} onCancelRequest={updateRequest}/> : view === "request" ? <RequestForm requester={account.name} requesterRole={visibleRole} requesterOffice={accountOffice} requesterDetails={currentStaff} approvers={approvers} offices={offices} onCreate={createRequest}/> : view === "approvals" ? <Approvals requests={requests} role={role} accountName={account.name} accountOffice={accountOffice} onStatus={updateStatus}/> : view === "trips" ? <TripPlanning requests={visibleRequests} vehicles={visibleVehicles} adminName={account.name} onUpdateRequest={updateRequest} onUpdateVehicle={updateVehicle}/> : view === "vehicles" ? <VehicleManagement vehicles={visibleVehicles} office={accountOffice} offices={offices} canViewAll={canViewAllOffices} onAdd={addVehicle} onUpdate={updateVehicle}/> : view === "reports" && canAccessReports ? <Reports requests={role === "admin" ? visibleRequests : requests} office={accountOffice} offices={offices} canViewAll={canViewAllOffices}/> : view === "settings" && role === "super_admin" ? <RootSettings users={users} requests={requests} vehicles={vehicles} offices={offices} onAddUser={addUser} onAddOffice={addOffice} onRemoveOffice={removeOffice} onUpdateUser={updateUser} onUpdateRequest={updateRequest}/> : <Dashboard requests={visibleRequests} onNew={() => navigate("request")} onNavigate={navigate} />;

  return <>
    <div className={`app-shell ${theme === "dark" ? "theme-dark" : ""}`}><aside className={`sidebar ${sidebarOpen?"open":""}`}><div className="brand"><img className="official-logo" src="/chrysalis-official.png" alt="Chrysalis — Catalyzing change"/></div><div className="role-badge"><span>{account.initials}</span><div><small>SIGNED IN AS</small><strong>{account.label}</strong>{role === "admin" && <small>{accountOffice}</small>}{role === "super_admin" && <small>ALL OFFICES · ROOT ACCESS</small>}</div></div><nav aria-label="Primary navigation">{allowedNav.map(item=><button key={item.id} className={view===item.id?"active":""} onClick={()=>navigate(item.id)}><span>{item.short}</span>{item.label}{item.id==="approvals"&&<b>{notificationItems.length}</b>}</button>)}</nav><div className="sidebar-bottom"><button className="support-card" onClick={()=>setHelpOpen(true)}><span>?</span><strong>Need help?</strong><p>Read the operations guide</p></button><button className="main-login-button" onClick={logout}><span>←</span><strong>Main login</strong><small>Exit workspace & switch account</small></button><button className="profile" onClick={logout} title="Sign out"><span className="avatar pink">{account.initials}</span><span><strong>{account.name}</strong><small>{account.label} · Sign out</small></span><i>↗</i></button></div></aside>{sidebarOpen&&<button className="overlay" aria-label="Close menu" onClick={()=>setSidebarOpen(false)}/>}<main><header className="topbar"><button className="mobile-menu" onClick={()=>setSidebarOpen(true)}>☰</button><p><span>Mobility Operations</span><b>/</b>{activeLabel}</p><div className="top-actions"><span className={`sync-state ${syncStatus}`} title="Shared workspace status"><i />{syncStatus === "synced" ? "Shared" : syncStatus === "saving" ? "Saving" : syncStatus === "connecting" ? "Connecting" : "Offline"}</span><span className="header-role">{account.label}{role === "admin" ? ` · ${accountOffice}` : ""}</span><button type="button" className="theme-toggle-button" onClick={toggleTheme} title={theme === "dark" ? "Switch to Light theme" : "Switch to Dark theme"} aria-label="Toggle theme"><span className="theme-toggle-icon">{theme === "dark" ? "☀️" : "🌙"}</span><span className="theme-toggle-text">{theme === "dark" ? "Light theme" : "Dark theme"}</span></button><button aria-label="Search" onClick={()=>{setSearchOpen(true);setNotificationsOpen(false)}}>⌕</button><button aria-label={`${unreadNotifications.length} unread notifications`} className="notification" onClick={()=>{setNotificationsOpen(value=>!value);setSearchOpen(false)}}>♧{unreadNotifications.length>0&&<b>{unreadNotifications.length>9?"9+":unreadNotifications.length}</b>}</button><span className="top-date">14 AUG 2026</span></div></header><div className="content">{content}</div></main></div>
    {searchOpen && <div className="utility-backdrop"><section className="utility-dialog" role="dialog" aria-modal="true" aria-label="Search workspace"><header><h2>Search workspace</h2><button aria-label="Close search" onClick={()=>setSearchOpen(false)}>×</button></header><input placeholder="Search sections or requests" value={searchQuery} onChange={event=>setSearchQuery(event.target.value)}/><div className="utility-results">{allowedNav.filter(item=>item.label.toLowerCase().includes(searchQuery.toLowerCase())).map(item=><button key={item.id} onClick={()=>navigate(item.id)}><span>{item.short}</span><p><strong>{item.label}</strong><small>Open workspace section</small></p><b>→</b></button>)}{requests.filter(item=>`${item.id} ${item.person} ${item.route}`.toLowerCase().includes(searchQuery.toLowerCase())).slice(0,5).map(item=><button key={item.id} onClick={()=>{navigate(account.views.includes("approvals")?"approvals":"calendar");announce(`${item.id} selected.`)}}><span>VR</span><p><strong>{item.id} · {item.route}</strong><small>{item.person} · {item.status}</small></p><b>→</b></button>)}</div></section></div>}
    {notificationsOpen && <aside className="notification-panel"><header><div><h2>Notifications</h2><small>{unreadNotifications.length} unread · {account.label}</small></div><div>{unreadNotifications.length>0&&<button className="mark-read" onClick={markAllNotificationsRead}>Read all</button>}<button aria-label="Close notifications" onClick={()=>setNotificationsOpen(false)}>×</button></div></header>{desktopAlertPermission!=="granted"&&<section className="desktop-alert-card"><span>↗</span><div><strong>Desktop alerts</strong><p>{desktopAlertPermission==="denied"?"Blocked in browser settings. Allow notifications to receive alerts.":desktopAlertPermission==="unsupported"?"This browser does not support desktop alerts.":"Get approval and trip alerts while this site is open."}</p></div>{desktopAlertPermission!=="denied"&&desktopAlertPermission!=="unsupported"&&<button onClick={enableDesktopAlerts}>Enable</button>}</section>}<div className="notification-list">{notificationItems.length?notificationItems.map(item=><button className={readNotificationIds.includes(item.id)?"read":"unread"} key={item.id} onClick={()=>openNotification(item)}><span className={`notice-icon ${item.tone}`}>{item.tone==="amber"?"!":item.tone==="red"?"↺":"✓"}</span><p><strong>{item.title}</strong><small>{item.detail}</small></p>{!readNotificationIds.includes(item.id)&&<i/>}</button>):<div className="notification-empty"><span>✓</span><strong>You’re all caught up</strong><p>New approvals and trip updates will appear here.</p></div>}</div><footer>In-app notifications are active. Official email addresses are required before email delivery can be connected.</footer></aside>}
    {notice && <div className="app-toast" role="status"><span>✓</span>{notice}<button aria-label="Dismiss message" onClick={()=>setNotice("")}>×</button></div>}
    {helpOpen && (
      <HelpGuideModal
        isOpen={helpOpen}
        onClose={() => setHelpOpen(false)}
        onNavigateToRequest={() => {
          setHelpOpen(false);
          navigate("request");
        }}
        currentUser={account.name}
        currentRole={account.label}
        currentOffice={accountOffice}
        onAnnounce={announce}
      />
    )}
  </>;
}
