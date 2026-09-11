import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { currentEmployeeSession } from "@/lib/internal-auth";
import EmployeeLogin from "../employee-login";

export default async function SignInPage() {
  const employee = await currentEmployeeSession();
  const { userId } = await auth();
  if (employee || userId) redirect("/");

  return (
    <main className="login-cinema">
      {/* Dynamic 3D Cinematic Background Atmosphere */}
      <div className="cinema-bg-canvas" aria-hidden="true">
        <div className="cinema-mesh-grid" />
        <div className="cinema-beam cinema-beam-cyan" />
        <div className="cinema-beam cinema-beam-purple" />
        <div className="cinema-beam cinema-beam-gold" />
        <div className="cinema-floating-orb orb-1" />
        <div className="cinema-floating-orb orb-2" />
        <div className="cinema-floating-orb orb-3" />
        <div className="cinema-3d-rings">
          <div className="ring ring-outer" />
          <div className="ring ring-mid" />
          <div className="ring ring-inner" />
        </div>
      </div>

      {/* Left 3D Cinematic Narrative Section */}
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
          <div className="cinema-live-pill">
            <span className="live-beacon" />
            <span>SECURE GATEWAY</span>
          </div>
        </header>

        {/* 3D Cinematic Travel & Mobility Hologram Stage */}
        <div className="travel-3d-stage">
          <div className="travel-hologram">
            {/* Holographic Radar & Orbital Rings */}
            <div className="travel-radar-ring outer-ring" />
            <div className="travel-radar-ring mid-ring" />
            <div className="travel-radar-sweep" />

            {/* 3D Wireframe Globe Mesh */}
            <div className="travel-globe-3d">
              <div className="globe-lat-line lat-1" />
              <div className="globe-lat-line lat-2" />
              <div className="globe-lat-line lat-3" />
              <div className="globe-long-line long-1" />
              <div className="globe-long-line long-2" />
              <div className="globe-core-glow" />
            </div>

            {/* Glowing Inter-Office Route Trajectories */}
            <svg className="travel-routes-svg" viewBox="0 0 340 340" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="routeGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
                  <stop offset="50%" stopColor="#818cf8" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.9" />
                </linearGradient>
                <linearGradient id="routeGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.85" />
                </linearGradient>
              </defs>
              <path d="M 70,220 C 85,130 185,95 270,135" stroke="url(#routeGrad1)" strokeWidth="2.5" strokeDasharray="6 4" className="animated-route-1" />
              <path d="M 95,255 C 135,215 215,235 255,175" stroke="url(#routeGrad2)" strokeWidth="2" strokeDasharray="4 4" className="animated-route-2" />
              <path d="M 125,85 C 175,125 215,175 205,265" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="1.5" strokeDasharray="3 3" />
            </svg>

            {/* Waypoint Nodes for Mobility Hubs */}
            <div className="waypoint-node node-head-office">
              <span className="waypoint-pulse" />
              <span className="waypoint-dot" />
              <span className="waypoint-label">Head Office</span>
            </div>
            <div className="waypoint-node node-central">
              <span className="waypoint-pulse" />
              <span className="waypoint-dot" />
              <span className="waypoint-label">Central Hub</span>
            </div>
            <div className="waypoint-node node-northern">
              <span className="waypoint-pulse" />
              <span className="waypoint-dot" />
              <span className="waypoint-label">Northern Hub</span>
            </div>
            <div className="waypoint-node node-southern">
              <span className="waypoint-pulse" />
              <span className="waypoint-dot" />
              <span className="waypoint-label">Southern Hub</span>
            </div>

            {/* 3D Floating Vehicle / Telemetry Indicator */}
            <div className="travel-vehicle-badge">
              <div className="vehicle-badge-glow" />
              <div className="vehicle-icon-wrap">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                  <circle cx="7" cy="17" r="2" />
                  <path d="M9 17h6" />
                  <circle cx="17" cy="17" r="2" />
                </svg>
              </div>
              <div className="vehicle-meta">
                <strong>Islandwide Mobility Hub</strong>
                <small>Active dispatch &amp; route clearance</small>
              </div>
            </div>
          </div>

          {/* Minimalist Punchy Headline (No clutter / Minimal words) */}
          <div className="travel-clean-caption">
            <h2>Smart Mobility. <em>Every Journey.</em></h2>
            <p>Chrysalis official staff transport &amp; vehicle management console</p>
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

        <p className="cinema-version">
          <span>Chrysalis</span> · Internal Mobility Management · Version 2.0
        </p>
      </section>
    </main>
  );
}
