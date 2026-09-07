import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { currentEmployeeSession } from "@/lib/internal-auth";
import Workspace from "./workspace";

export default async function HomePage() {
  const employee = await currentEmployeeSession();
  if (employee) return <Workspace viewerEmail={`EMP No: ${employee.empNo}`} viewerName={employee.name} />;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const user = await currentUser();
  const primary = user?.emailAddresses.find(item => item.id === user.primaryEmailAddressId)?.emailAddress ?? user?.emailAddresses[0]?.emailAddress;
  if (!primary) redirect("/sign-in");
  return <Workspace viewerEmail={primary} viewerName={user?.fullName || user?.firstName || primary} />;
}
