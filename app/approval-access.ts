import type { StaffMember } from "./staff-data";

export type StaffApprovalRole = "user" | "project_manager" | "project_director" | "ceo";

// Official positions stay unchanged; this map controls approval authority only.
const CEO_EMPLOYEE_NUMBERS = new Set(["1", "3", "20"]);
const PROJECT_DIRECTOR_EMPLOYEE_NUMBERS = new Set(["59"]);

export function approvalAccessForStaff(staff: StaffMember): StaffApprovalRole {
  if (CEO_EMPLOYEE_NUMBERS.has(staff.empNo)) return "ceo";
  if (PROJECT_DIRECTOR_EMPLOYEE_NUMBERS.has(staff.empNo)) return "project_director";

  const position = staff.position.toLowerCase();
  if (
    position.includes("senior project coordinator") ||
    position.includes("project manager") ||
    position.includes("project and area manager") ||
    position.includes("project & area manager")
  ) return "project_manager";

  return "user";
}

// A person's official/display role is intentionally separate from delegated
// approval authority. Rislan can exercise CEO approval authority while still
// appearing as a Project Director, and Vinopavan can exercise Project Director
// authority while still appearing as a Project Manager.
export function displayRoleForStaff(staff: StaffMember): StaffApprovalRole {
  if (staff.empNo === "20") return "project_director";
  if (staff.empNo === "59") return "project_manager";
  return approvalAccessForStaff(staff);
}

export function displayTitleForStaff(staff: StaffMember): string | undefined {
  if (staff.empNo === "20") return "Project Director";
  if (staff.empNo === "59") return "Project Manager";
  return undefined;
}

export function actingAccessForStaff(staff: StaffMember): string | undefined {
  if (staff.empNo === "3") return "CEO";
  return undefined;
}

export const legacySampleApproverIds = new Set(["USR-003", "USR-004", "USR-005", "USR-006", "USR-010"]);
