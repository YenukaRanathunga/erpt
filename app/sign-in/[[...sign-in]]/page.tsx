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

      {/* Left 3D Daylight Travel & Navigation Section */}
      <section className="login-cinema-visual" aria-label="Chrysalis Mobility Operations">
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

        {/* 3D Isometric Daylight Travel Map & Navigation Stage */}
        <div className="travel-3d-stage">
          <div className="travel-map-viewport">
            <div className="isometric-map-deck">
              {/* Isometric Ground Layers */}
              <div className="iso-map-base">
                <div className="iso-grid-lines" />
                <div className="iso-river-curve" />
                <div className="iso-park-zone zone-1" />
                <div className="iso-park-zone zone-2" />
              </div>

              {/* 3D Isometric Buildings & Hub Landmarks */}
              <div className="iso-buildings">
                <div className="iso-building bldg-1" />
                <div className="iso-building bldg-2" />
                <div className="iso-building bldg-3" />
                <div className="iso-building bldg-4" />
                <div className="iso-building bldg-5" />
              </div>

              {/* Curving 3D Navigation Route Vector */}
              <svg className="iso-route-svg" viewBox="0 0 360 360" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="travelPathGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0284c7" />
                    <stop offset="50%" stopColor="#0ea5e9" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                  <filter id="routeGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
                {/* Secondary transit links */}
                <path d="M 80,240 C 130,220 180,250 250,190" stroke="rgba(2, 132, 199, 0.28)" strokeWidth="3" strokeDasharray="6 6" />
                {/* Primary highway route */}
                <path d="M 90,260 C 120,180 200,190 280,110" stroke="url(#travelPathGrad)" strokeWidth="4.5" strokeLinecap="round" strokeDasharray="8 6" className="animated-travel-path" filter="url(#routeGlow)" />
              </svg>

              {/* Hub Destination Waypoints */}
              <div className="iso-waypoint hub-colombo">
                <span className="hub-marker-ping" />
                <span className="hub-marker-dot" />
                <span className="hub-tag">Head Office</span>
              </div>
              <div className="iso-waypoint hub-kandy">
                <span className="hub-marker-ping" />
                <span className="hub-marker-dot" />
                <span className="hub-tag">Central Hub</span>
              </div>
              <div className="iso-waypoint hub-galle">
                <span className="hub-marker-ping" />
                <span className="hub-marker-dot" />
                <span className="hub-tag">Southern Hub</span>
              </div>

              {/* 3D Realistic Glossy Red Location Pin Standing Upright */}
              <div className="iso-3d-pin-wrap">
                <div className="pin-ground-shadow" />
                <div className="pin-ground-pulse" />
                <div className="pin-3d-stem">
                  <div className="pin-head-3d">
                    <div className="pin-inner-hole" />
                    <div className="pin-specular-light" />
                  </div>
                  <div className="pin-needle-tip" />
                </div>
                <div className="pin-active-tag">Active Destination</div>
              </div>
            </div>

            {/* Floating 3D Fleet Status Capsule */}
            <div className="travel-fleet-badge">
              <div className="fleet-badge-icon">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                  <circle cx="7" cy="17" r="2" />
                  <path d="M9 17h6" />
                  <circle cx="17" cy="17" r="2" />
                </svg>
              </div>
              <div className="fleet-badge-text">
                <strong>Islandwide Mobility Fleet</strong>
                <small>Real-time vehicle telemetry &amp; dispatch</small>
              </div>
            </div>
          </div>

          {/* Clean Punchy Headline (Minimal words) */}
          <div className="travel-clean-caption">
            <h2>Smart Mobility. <em>Every Journey.</em></h2>
            <p>Intelligent staff transport &amp; islandwide fleet operations</p>
          </div>
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
