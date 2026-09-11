import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { currentEmployeeSession } from "@/lib/internal-auth";
import EmployeeLogin from "../employee-login";

export default async function SignInPage() {
  const employee = await currentEmployeeSession();
  const { userId } = await auth();
  if (employee || userId) redirect("/");

  return (
    <main className="login-cinema-fullscreen">
      {/* Full-Page 3D Isometric Mobility City Background */}
      <div className="fullscreen-city-bg" aria-hidden="true">
        <img 
          src="/mobility-fleet-3d.jpg" 
          alt="Chrysalis 3D Smart Mobility City" 
          className="fullscreen-city-img"
        />
        <div className="fullscreen-city-overlay" />
      </div>

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

        {/* Right Floating Daylight Glassmorphic Login Card */}
        <div className="cinema-right-column">
          <section className="login-cinema-card" aria-label="Internal Staff Authentication">
            <div className="cinema-card-sheen" />
            <div className="cinema-card-glow" />

            <header className="cinema-mobile-brand">
              <img src="/chrysalis-official.png" alt="Chrysalis — Catalyzing change" />
              <div>
                <strong>Chrysalis</strong>
                <span>Mobility Operations</span>
              </div>
            </header>

            <div className="cinema-card-head">
              <div className="cinema-access-icon-3d">
                <span>🔐</span>
              </div>
              <div className="cinema-card-titles">
                <p className="eyebrow">INTERNAL STAFF ACCESS</p>
                <h2>Welcome back</h2>
              </div>
            </div>

            <p className="cinema-intro">
              Verify your official work email and Employee Number to enter your assigned workspace securely.
            </p>

            <div className="cinema-form-container">
              <EmployeeLogin />
            </div>

            <div className="cinema-security-3d">
              <span className="security-shield">✓</span>
              <div>
                <strong>End-to-End Audited Access</strong>
                <small>Protected by organizational 2FA identity challenge</small>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
