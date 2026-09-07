import { staffMembers } from "./staff-data";
import { actingAccessForStaff, approvalAccessForStaff, displayRoleForStaff, displayTitleForStaff } from "./approval-access";

export function createSeedState() {
  const staffUsers = staffMembers.map(staff => ({
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
    actingFor: actingAccessForStaff(staff),
  }));

  return {
    requests: [
      { id: "VR-260814-042", person: "Lasantha Soysa", route: "Colombo → Badulla", date: "17 Aug", time: "06:30", status: "Awaiting approval", tone: "amber", budget: "COPEJW602162", office: "Head Office", createdByRole: "user", awaitingRole: "project_manager" },
      { id: "VR-260814-041", person: "Keerthi Indrajith", route: "Colombo → Badulla", date: "17 Aug", time: "07:00", status: "Approved", tone: "green", budget: "HRD-2026-118", office: "Head Office" },
      { id: "VR-260814-039", person: "Thirumarugan R.", route: "Batticaloa → Kandy", date: "16 Aug", time: "08:30", status: "Needs revision", tone: "red", budget: "OPS-26-771", office: "Batticaloa Area Office" },
      { id: "VR-260813-036", person: "Amali Perera", route: "Galle → Matara", date: "16 Aug", time: "09:00", status: "Trip scheduled", tone: "blue", budget: "FIELD-26-041", office: "Galle Area Office" },
    ],
    users: [
      ...staffUsers,
      { id: "USR-001", name: "Yenuka K.", email: "yenuka@chrysalis.lk", authEmail: "yenukaadarsha93@gmail.com", role: "super_admin" as const, office: "Head Office", active: true, protected: true },
      { id: "USR-ROOT-INFO", name: "Chrysalis Admin", email: "info@chrysaliscatalyz.com", authEmail: "info@chrysaliscatalyz.com", role: "super_admin" as const, office: "Head Office", active: true, protected: true },
      { id: "USR-ROOT-IT", name: "Chrysalis IT Support", email: "itsupport@chrysaliscatalyz.com", authEmail: "itsupport@chrysaliscatalyz.com", role: "super_admin" as const, office: "Head Office", active: true, protected: true },
      { id: "USR-007", name: "Indika Fernando", email: "indika.fernando@chrysalis.lk", authEmail: "indika.fernando@chrysaliscatalyz.com", role: "admin" as const, office: "Head Office", active: true, empNo: "255" },
      { id: "USR-011", name: "Head of Operations", email: "Login email to be assigned", role: "head_operations" as const, office: "Head Office", active: true },
      { id: "USR-012", name: "Iruthayarajah Rohan", email: "iruthayarajah.rohan@chrysalis.lk", role: "admin" as const, office: "Kilinochchi Area Office", active: true, empNo: "116" },
      { id: "USR-013", name: "Jayani Udakumbura", email: "jayani.udakumbura@chrysalis.lk", role: "admin" as const, office: "Kandy Area Office", active: true, empNo: "197" },
      { id: "USR-014", name: "Ishara Dharmasiri", email: "ishara.dharmasiri@chrysalis.lk", role: "admin" as const, office: "Badulla Area Office", active: true, empNo: "209" },
      { id: "USR-015", name: "Mufli Mohamed", email: "mufli.mohamed@chrysalis.lk", role: "admin" as const, office: "Puttalam Area Office", active: true, empNo: "159" },
      { id: "USR-016", name: "Anita Amily", email: "anita.amily@chrysalis.lk", role: "admin" as const, office: "Batticaloa Area Office", active: true, empNo: "178" },
      { id: "USR-017", name: "Sarath Kumara", email: "sarath.kumara@chrysalis.lk", role: "admin" as const, office: "Matara Area Office", active: true, empNo: "195" },
    ],
    offices: [...new Set(["Head Office", "Galle Area Office", ...staffMembers.map(staff => staff.office)])],
    vehicles: [
      { id: "VEH-001", registration: "CP CAB-1842", company: "Chrysalis Transport Partner", model: "Toyota HiAce", type: "Van", seats: 9, office: "Head Office", fuel: "Diesel", status: "Available" },
      { id: "VEH-002", registration: "WP KV-7712", company: "Chrysalis Transport Partner", model: "Nissan Caravan", type: "Van", seats: 12, office: "Head Office", fuel: "Diesel", status: "Available" },
      { id: "VEH-003", registration: "SP CAD-5521", company: "Southern Transport Partner", model: "Toyota KDH", type: "Van", seats: 8, office: "Matara Area Office", fuel: "Diesel", status: "Available" },
      { id: "VEH-004", registration: "WP KX-9044", company: "Colombo Express Fleet", model: "Toyota Coaster", type: "Bus", seats: 29, office: "Head Office", fuel: "Diesel", status: "Available" },
    ],
    conversations: [],
  };
}
