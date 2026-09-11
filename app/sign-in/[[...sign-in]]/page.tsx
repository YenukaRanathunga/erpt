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

        <div className="cinema-story">
          <div className="cinema-headline-eyebrow">
            <span className="eyebrow-line" />
            <span>INTELLIGENT FLEET &amp; LOGISTICS</span>
          </div>
          
          <h1 className="cinema-hero-title">
            Every request.
            <span className="cinema-hero-gradient">One clear journey.</span>
          </h1>

          <p className="cinema-hero-description">
            Plan, authorize and synchronize staff transport across all provincial hubs through one high-precision operational console.
          </p>

          <div className="cinema-steps-3d">
            <div className="step-card step-1">
              <div className="step-badge">01</div>
              <div className="step-info">
                <strong>Request</strong>
                <small>Journey &amp; budget</small>
              </div>
            </div>
            <div className="step-connector">
              <span className="connector-dot" />
            </div>
            <div className="step-card step-2">
              <div className="step-badge">02</div>
              <div className="step-info">
                <strong>Approve</strong>
                <small>Multi-role audit</small>
              </div>
            </div>
            <div className="step-connector">
              <span className="connector-dot" />
            </div>
            <div className="step-card step-3">
              <div className="step-badge">03</div>
              <div className="step-info">
                <strong>Operate</strong>
                <small>Dispatch &amp; fulfill</small>
              </div>
            </div>
          </div>

          <div className="cinema-metrics-bar">
            <div className="metric-chip">
              <span className="metric-icon">✦</span>
              <div>
                <strong>Islandwide Coverage</strong>
                <small>9 Active Project Hubs</small>
              </div>
            </div>
            <div className="metric-divider" />
            <div className="metric-chip">
              <span className="metric-icon">🛡</span>
              <div>
                <strong>Role-Based Control</strong>
                <small>Multi-level approvals</small>
              </div>
            </div>
          </div>
        </div>

        <footer className="cinema-visual-footer">
          <span>Enterprise mobility platform</span>
          <i>•</i>
          <span>ISO standard fleet workflow</span>
        </footer>
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
