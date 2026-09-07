import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { currentEmployeeSession } from "@/lib/internal-auth";
import EmployeeLogin from "../employee-login";

export default async function SignInPage() {
  const employee = await currentEmployeeSession();
  const { userId } = await auth();
  if (employee || userId) redirect("/");
  return <main className="login-cinema">
    <section className="login-cinema-visual" aria-label="Chrysalis Mobility Operations">
      <div className="cinema-glow cinema-glow-one"/><div className="cinema-glow cinema-glow-two"/>
      <div className="cinema-orbit cinema-orbit-one"/><div className="cinema-orbit cinema-orbit-two"/>
      <header className="cinema-brand"><img src="/chrysalis-official.png" alt="Chrysalis — Catalyzing change"/></header>
      <div className="cinema-story">
        <p>TRANSPORT OPERATIONS PLATFORM</p>
        <h1>Every request.<br/><em>One clear journey.</em></h1>
        <span>Plan, approve and coordinate staff travel through one calm, controlled operational workspace.</span>
        <div className="cinema-steps"><article><b>01</b><div><strong>Request</strong><small>Journey &amp; budget</small></div></article><i/><article><b>02</b><div><strong>Approve</strong><small>Role-based control</small></div></article><i/><article><b>03</b><div><strong>Operate</strong><small>Dispatch &amp; complete</small></div></article></div>
      </div>
      <footer><span>✓</span> Private company access · Complete activity history</footer>
    </section>
    <section className="login-cinema-panel">
      <div className="login-cinema-card">
        <header className="cinema-mobile-brand"><img src="/chrysalis-official.png" alt="Chrysalis — Catalyzing change"/></header>
        <div className="cinema-access-icon"><span>↗</span></div>
        <p className="eyebrow">INTERNAL STAFF ACCESS</p>
        <h2>Welcome back</h2>
        <p className="cinema-intro">Verify your work email and Employee Number to open your assigned workspace securely.</p>
        <EmployeeLogin />
        <div className="cinema-security"><span>✓</span><div><strong>Controlled access</strong><small>Only active staff profiles can enter this workspace.</small></div></div>
      </div>
      <p className="cinema-version">Chrysalis · Internal mobility management · Version 2.0</p>
    </section>
  </main>;
}
