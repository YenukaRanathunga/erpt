"use client";

import { useEffect, useState } from "react";
import { getSeasonalTheme, type SeasonalTheme } from "@/app/seasonal-theme";

export default function SeasonalBackground() {
  const [theme, setTheme] = useState<SeasonalTheme | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setTheme(getSeasonalTheme());
  }, []);

  if (!theme) return null;

  return (
    <div className="fullscreen-city-bg" aria-hidden="true">
      <img
        src={theme.image}
        alt={`Chrysalis 3D Smart Mobility — ${theme.label}`}
        className="fullscreen-city-img"
        onLoad={() => setLoaded(true)}
        style={{ opacity: loaded ? 1 : 0, transition: "opacity 0.8s ease" }}
      />
      <div
        className="fullscreen-city-overlay"
        style={{ background: theme.overlayColor }}
      />
      {/* Seasonal greeting badge */}
      {theme.id !== "default" && (
        <div
          className="seasonal-greeting-badge"
          style={{
            position: "absolute",
            bottom: 28,
            left: 28,
            zIndex: 20,
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 20px",
            borderRadius: 16,
            background:
              theme.id === "halloween" || theme.id === "newyear"
                ? "rgba(0,0,0,0.55)"
                : "rgba(255,255,255,0.85)",
            backdropFilter: "blur(12px)",
            border: `1px solid ${theme.accentColor}33`,
            boxShadow: `0 8px 24px ${theme.accentColor}20`,
            color:
              theme.id === "halloween" || theme.id === "newyear"
                ? "#fff"
                : theme.textPrimary,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.02em",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: theme.accentColor,
              boxShadow: `0 0 8px ${theme.accentColor}`,
            }}
          />
          {theme.label}
        </div>
      )}
    </div>
  );
}
