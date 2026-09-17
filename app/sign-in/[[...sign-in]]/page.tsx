import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { currentEmployeeSession } from "@/lib/internal-auth";
import EmployeeLogin from "../employee-login";
import SeasonalBackground from "../seasonal-background";
import SeasonalLoginCard from "../seasonal-login-card";
import SeasonalCardHead from "../seasonal-card-head";

export default async function SignInPage() {
  const employee = await currentEmployeeSession();
  const { userId } = await auth();
  if (employee || userId) redirect("/");

  return (
    <main className="login-cinema-fullscreen">
      {/* Seasonal 3D Background — auto-switches by date */}
      <SeasonalBackground />

      {/* Balanced Floating Workspace Container */}
      <div className="fullscreen-cinema-layout">
        {/* Left Floating Brand Capsule & Tagline */}
        <div className="cinema-left-column">
          <header className="cinema-logo-capsule">
            <img src="/chrysalis-official.png" alt="Chrysalis — Catalyzing change" />
            <div className="cinema-logo-divider" />
            <div className="cinema-logo-meta">
              <strong>Chrysalis</strong>
              <span>Mobility Operations</span>
            </div>
          </header>

          <aside className="fleet-glass-caption">
            <h2>Smart Mobility. <em>Every Journey.</em></h2>
            <p>Intelligent staff transport &amp; islandwide fleet operations</p>
          </aside>
        </div>

        {/* Right Floating Seasonal Glassmorphic Login Card */}
        <div className="cinema-right-column">
          <SeasonalLoginCard>
            <header className="cinema-mobile-brand">
              <img src="/chrysalis-official.png" alt="Chrysalis — Catalyzing change" />
              <div>
                <strong>Chrysalis</strong>
                <span>Mobility Operations</span>
              </div>
            </header>

            <SeasonalCardHead />

            <p className="cinema-intro">
              Verify your official work email and Employee Number to enter your assigned workspace securely.
            </p>

            <div className="cinema-form-container">
              <EmployeeLogin />
            </div>
          </SeasonalLoginCard>
        </div>
      </div>
    </main>
  );
}
