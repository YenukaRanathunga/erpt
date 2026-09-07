import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chrysalis Mobility Operations",
  description: "Secure travel request, approval and fleet operations platform.",
  icons: { icon: "/chrysalis-official.png" },
  openGraph: { images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <ClerkProvider><html lang="en"><body>{children}</body></html></ClerkProvider>;
}
