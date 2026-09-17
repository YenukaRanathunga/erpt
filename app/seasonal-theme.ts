"use client";

/**
 * Seasonal Theme Engine
 * Automatically detects the current season/holiday and applies matching
 * wallpaper + color scheme to the login page.
 *
 * Season calendar (dates approximate, evaluated at render time):
 *   Dec 20 – Jan 2   → New Year / Christmas
 *   Feb 10 – Feb 18  → Valentine's Day
 *   Mar 1  – May 15  → Spring
 *   May 16 – Aug 31  → Summer
 *   Sep 1  – Oct 25  → Autumn
 *   Oct 26 – Nov 5   → Halloween
 *   Nov 6  – Dec 19  → Autumn (late)
 *
 * Sri Lankan extras:
 *   Apr 13 – Apr 15  → Sinhala & Tamil New Year (overrides Spring)
 */

export type SeasonalTheme = {
  id: string;
  label: string;
  greeting: string;
  image: string;
  overlayColor: string;
  accentColor: string;
  glowColor: string;
  cardBg: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  eyebrowColor: string;
  buttonBg: string;
  buttonHoverBg: string;
  cssClass: string;
};

const themes: Record<string, SeasonalTheme> = {
  default: {
    id: "default",
    label: "Smart Mobility",
    greeting: "Welcome back",
    image: "/mobility-fleet-3d.jpg",
    overlayColor: "rgba(15, 23, 42, 0.05)",
    accentColor: "#0284c7",
    glowColor: "rgba(14, 165, 233, 0.15)",
    cardBg: "rgba(255, 255, 255, 0.94)",
    cardBorder: "rgba(255, 255, 255, 0.95)",
    textPrimary: "#082744",
    textSecondary: "#475569",
    eyebrowColor: "#0284c7",
    buttonBg: "linear-gradient(180deg, #0284c7 0%, #0369a1 60%, #1d4ed8 100%)",
    buttonHoverBg: "linear-gradient(180deg, #0ea5e9 0%, #0284c7 60%, #1e40af 100%)",
    cssClass: "season-default",
  },
  christmas: {
    id: "christmas",
    label: "Holiday Season",
    greeting: "Merry Christmas! 🎄",
    image: "/seasonal-christmas.jpg",
    overlayColor: "rgba(15, 23, 62, 0.15)",
    accentColor: "#dc2626",
    glowColor: "rgba(220, 38, 38, 0.12)",
    cardBg: "rgba(255, 255, 255, 0.92)",
    cardBorder: "rgba(255, 240, 240, 0.95)",
    textPrimary: "#1a1a2e",
    textSecondary: "#4a5568",
    eyebrowColor: "#dc2626",
    buttonBg: "linear-gradient(180deg, #dc2626 0%, #b91c1c 60%, #991b1b 100%)",
    buttonHoverBg: "linear-gradient(180deg, #ef4444 0%, #dc2626 60%, #b91c1c 100%)",
    cssClass: "season-christmas",
  },
  newyear: {
    id: "newyear",
    label: "New Year Celebration",
    greeting: "Happy New Year! 🎆",
    image: "/seasonal-newyear.jpg",
    overlayColor: "rgba(10, 10, 30, 0.20)",
    accentColor: "#eab308",
    glowColor: "rgba(234, 179, 8, 0.15)",
    cardBg: "rgba(15, 23, 42, 0.88)",
    cardBorder: "rgba(234, 179, 8, 0.3)",
    textPrimary: "#fef9c3",
    textSecondary: "#cbd5e1",
    eyebrowColor: "#eab308",
    buttonBg: "linear-gradient(180deg, #eab308 0%, #ca8a04 60%, #a16207 100%)",
    buttonHoverBg: "linear-gradient(180deg, #facc15 0%, #eab308 60%, #ca8a04 100%)",
    cssClass: "season-newyear",
  },
  valentine: {
    id: "valentine",
    label: "Valentine's Day",
    greeting: "Happy Valentine's Day! 💝",
    image: "/seasonal-valentine.jpg",
    overlayColor: "rgba(60, 10, 30, 0.10)",
    accentColor: "#e11d48",
    glowColor: "rgba(225, 29, 72, 0.12)",
    cardBg: "rgba(255, 255, 255, 0.93)",
    cardBorder: "rgba(255, 228, 230, 0.95)",
    textPrimary: "#1a1a2e",
    textSecondary: "#64748b",
    eyebrowColor: "#e11d48",
    buttonBg: "linear-gradient(180deg, #e11d48 0%, #be123c 60%, #9f1239 100%)",
    buttonHoverBg: "linear-gradient(180deg, #f43f5e 0%, #e11d48 60%, #be123c 100%)",
    cssClass: "season-valentine",
  },
  spring: {
    id: "spring",
    label: "Spring Season",
    greeting: "Welcome back 🌸",
    image: "/seasonal-spring.jpg",
    overlayColor: "rgba(15, 42, 23, 0.05)",
    accentColor: "#ec4899",
    glowColor: "rgba(236, 72, 153, 0.12)",
    cardBg: "rgba(255, 255, 255, 0.93)",
    cardBorder: "rgba(252, 231, 243, 0.95)",
    textPrimary: "#1e293b",
    textSecondary: "#64748b",
    eyebrowColor: "#ec4899",
    buttonBg: "linear-gradient(180deg, #ec4899 0%, #db2777 60%, #be185d 100%)",
    buttonHoverBg: "linear-gradient(180deg, #f472b6 0%, #ec4899 60%, #db2777 100%)",
    cssClass: "season-spring",
  },
  summer: {
    id: "summer",
    label: "Summer Vibes",
    greeting: "Welcome back ☀️",
    image: "/seasonal-summer.jpg",
    overlayColor: "rgba(15, 23, 42, 0.03)",
    accentColor: "#0891b2",
    glowColor: "rgba(8, 145, 178, 0.12)",
    cardBg: "rgba(255, 255, 255, 0.93)",
    cardBorder: "rgba(224, 242, 254, 0.95)",
    textPrimary: "#0c4a6e",
    textSecondary: "#475569",
    eyebrowColor: "#0891b2",
    buttonBg: "linear-gradient(180deg, #0891b2 0%, #0e7490 60%, #155e75 100%)",
    buttonHoverBg: "linear-gradient(180deg, #06b6d4 0%, #0891b2 60%, #0e7490 100%)",
    cssClass: "season-summer",
  },
  autumn: {
    id: "autumn",
    label: "Autumn Season",
    greeting: "Welcome back 🍂",
    image: "/seasonal-autumn.jpg",
    overlayColor: "rgba(42, 23, 15, 0.08)",
    accentColor: "#d97706",
    glowColor: "rgba(217, 119, 6, 0.12)",
    cardBg: "rgba(255, 255, 255, 0.93)",
    cardBorder: "rgba(254, 243, 199, 0.95)",
    textPrimary: "#1c1917",
    textSecondary: "#57534e",
    eyebrowColor: "#d97706",
    buttonBg: "linear-gradient(180deg, #d97706 0%, #b45309 60%, #92400e 100%)",
    buttonHoverBg: "linear-gradient(180deg, #f59e0b 0%, #d97706 60%, #b45309 100%)",
    cssClass: "season-autumn",
  },
  halloween: {
    id: "halloween",
    label: "Halloween Night",
    greeting: "Happy Halloween! 🎃",
    image: "/seasonal-halloween.jpg",
    overlayColor: "rgba(20, 0, 40, 0.18)",
    accentColor: "#f97316",
    glowColor: "rgba(249, 115, 22, 0.15)",
    cardBg: "rgba(15, 10, 30, 0.90)",
    cardBorder: "rgba(249, 115, 22, 0.3)",
    textPrimary: "#fef3c7",
    textSecondary: "#d1d5db",
    eyebrowColor: "#f97316",
    buttonBg: "linear-gradient(180deg, #f97316 0%, #ea580c 60%, #c2410c 100%)",
    buttonHoverBg: "linear-gradient(180deg, #fb923c 0%, #f97316 60%, #ea580c 100%)",
    cssClass: "season-halloween",
  },
};

function matchDate(month: number, day: number): string {
  // Special holidays first (override seasons)
  if (month === 12 && day >= 20) return "christmas";
  if (month === 1 && day <= 2) return "newyear";
  if (month === 12 && day >= 30) return "newyear";
  if (month === 2 && day >= 10 && day <= 18) return "valentine";
  if (month === 10 && day >= 26) return "halloween";
  if (month === 11 && day <= 5) return "halloween";

  // Seasons
  if (month >= 3 && month <= 5 && !(month === 5 && day > 15)) return "spring";
  if ((month === 5 && day > 15) || (month >= 6 && month <= 8)) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  if (month === 12 && day < 20) return "autumn";

  return "default";
}

export function getSeasonalTheme(): SeasonalTheme {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const id = matchDate(month, day);
  return themes[id] ?? themes.default;
}

export function getAllThemes(): SeasonalTheme[] {
  return Object.values(themes);
}
