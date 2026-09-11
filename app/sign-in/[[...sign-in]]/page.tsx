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

          {/* Glowing Highway Route Flow Across the Full Fleet */}
          <svg className="full-fleet-route-svg" viewBox="0 0 700 500" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="fullFleetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0284c7" stopOpacity="0.95" />
                <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.95" />
              </linearGradient>
              <filter id="fullRouteGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            <path d="M 60,380 C 180,240 380,320 620,120" stroke="url(#fullFleetGrad)" strokeWidth="5" strokeLinecap="round" strokeDasharray="12 8" className="animated-full-route" filter="url(#fullRouteGlow)" />
          </svg>

          {/* 3D Realistic Glossy Red Location Pin Standing Upright */}
          <div className="full-fleet-pin-wrap">
            <div className="pin-ground-shadow" />
            <div className="pin-ground-pulse" />
            <div className="pin-3d-stem">
              <div className="pin-head-3d">
                <div className="pin-inner-hole" />
                <div className="pin-specular-light" />
              </div>
              <div className="pin-needle-tip" />
            </div>
            <div className="pin-active-tag">Colombo HQ</div>
          </div>
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

        {/* Center Live Telemetry Pill Floating Over Fleet */}
        <div className="full-fleet-telemetry-stage">
          <div className="telemetry-pill-group">
            <div className="full-fleet-badge">
              <span className="live-fleet-dot" />
              <div className="fleet-badge-text">
                <strong>Islandwide Mobility Fleet</strong>
                <small>18 Active Vehicles Dispatched • Real-time Telemetry</small>
              </div>
            </div>
          </div>
        </div>

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
