import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { currentEmployeeSession } from "@/lib/internal-auth";
import EmployeeLogin from "../employee-login";

export default async function SignInPage() {
  const employee = await currentEmployeeSession();
  const { userId } = await auth();
  if (employee || userId) redirect("/");

  return (
    <main className="login-cinema light-travel-theme">
      {/* Light Travel Atmospheric Canvas */}
      <div className="travel-light-canvas" aria-hidden="true">
        <div className="travel-sky-glow" />
        <div className="travel-sun-beam" />
        <div className="travel-geo-grid" />
        <div className="travel-floating-cloud cloud-1" />
        <div className="travel-floating-cloud cloud-2" />
        <div className="travel-floating-cloud cloud-3" />
        <div className="travel-flight-ring ring-1" />
        <div className="travel-flight-ring ring-2" />
      </div>

      {/* Left 3D Daylight Travel & Full-Area Fleet Section */}
      <section className="login-cinema-visual visual-full-fleet-mode" aria-label="Chrysalis Mobility Operations">
        {/* Full-Bleed 3D Isometric Mobility Fleet Background */}
        <div className="visual-full-fleet-bg" aria-hidden="true">
          <img 
            src="/mobility-fleet-3d.jpg" 
            alt="Chrysalis 3D Mobility Fleet" 
            className="fleet-full-img"
          />
          <div className="fleet-full-tint" />
          <div className="fleet-full-vignette" />
        </div>

        <header className="cinema-brand">
          <div className="cinema-logo-capsule">
            <img src="/chrysalis-official.png" alt="Chrysalis — Catalyzing change" />
            <div className="cinema-logo-divider" />
            <div className="cinema-logo-meta">
              <strong>Chrysalis</strong>
              <span>Mobility Operations</span>
            </div>
          </div>
        </header>

        {/* Floating Minimalist Clean Caption */}
        <div className="travel-clean-caption fleet-glass-caption">
          <h2>Smart Mobility. <em>Every Journey.</em></h2>
          <p>Intelligent staff transport &amp; islandwide fleet operations</p>
        </div>
      </section>

      {/* Right 3D Floating Glassmorphic Login Panel */}
      <section className="login-cinema-panel">
        <div className="login-cinema-card">
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
        </div>
      </section>
    </main>
  );
}
