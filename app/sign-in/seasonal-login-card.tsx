"use client";

import { useEffect, useState } from "react";
import { getSeasonalTheme, type SeasonalTheme } from "@/app/seasonal-theme";

export default function SeasonalLoginCard({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setTheme] = useState<SeasonalTheme | null>(null);

  useEffect(() => {
    setTheme(getSeasonalTheme());
  }, []);

  const t = theme;
  const isDark =
    t?.id === "halloween" || t?.id === "newyear";

  return (
    <section
      className="login-cinema-card"
      aria-label="Internal Staff Authentication"
      style={
        t
          ? {
              background: t.cardBg,
              borderColor: t.cardBorder,
              ...(isDark
                ? {
                    boxShadow: `0 30px 70px -10px rgba(0,0,0,0.5), 0 0 60px ${t.accentColor}15`,
                  }
                : {}),
            }
          : undefined
      }
    >
      <div
        className="cinema-card-sheen"
        style={isDark ? { opacity: 0.15 } : undefined}
      />
      <div
        className="cinema-card-glow"
        style={
          t
            ? {
                background: `radial-gradient(circle at 70% 10%, ${t.glowColor}, transparent 60%)`,
              }
            : undefined
        }
      />

      {children}

      {/* Themed security footer */}
      <div
        className="cinema-security-3d"
        style={
          t && isDark
            ? {
                background: "rgba(255,255,255,0.06)",
                borderColor: "rgba(255,255,255,0.1)",
              }
            : undefined
        }
      >
        <span
          className="security-shield"
          style={
            t
              ? {
                  background: isDark
                    ? `${t.accentColor}20`
                    : undefined,
                  color: isDark ? t.accentColor : undefined,
                }
              : undefined
          }
        >
          ✓
        </span>
        <div>
          <strong
            style={
              t && isDark ? { color: t.textPrimary } : undefined
            }
          >
            End-to-End Audited Access
          </strong>
          <small
            style={
              t && isDark ? { color: t.textSecondary } : undefined
            }
          >
            Protected by organizational 2FA identity challenge
          </small>
        </div>
      </div>
    </section>
  );
}
