"use client";

import { useEffect, useState } from "react";
import { getSeasonalTheme, type SeasonalTheme } from "@/app/seasonal-theme";

export default function SeasonalCardHead() {
  const [theme, setTheme] = useState<SeasonalTheme | null>(null);

  useEffect(() => {
    setTheme(getSeasonalTheme());
  }, []);

  const t = theme;
  const isDark = t?.id === "halloween" || t?.id === "newyear";

  return (
    <div className="cinema-card-head">
      <div
        className="cinema-access-icon-3d"
        style={
          t
            ? {
                background: isDark
                  ? `linear-gradient(135deg, ${t.accentColor}30, ${t.accentColor}10)`
                  : `linear-gradient(135deg, ${t.accentColor}18, ${t.accentColor}08)`,
              }
            : undefined
        }
      >
        <span>🔐</span>
      </div>
      <div className="cinema-card-titles">
        <p
          className="eyebrow"
          style={t ? { color: t.eyebrowColor } : undefined}
        >
          INTERNAL STAFF ACCESS
        </p>
        <h2 style={t ? { color: t.textPrimary } : undefined}>
          {t?.greeting ?? "Welcome back"}
        </h2>
      </div>
    </div>
  );
}
