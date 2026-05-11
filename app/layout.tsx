import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ventus — Optimize Every Dispatch",
  description: "AI-powered dispatch optimization for HVAC companies. Maximize revenue per technician, minimize idle time.",
  keywords: ["HVAC", "dispatch optimization", "field service management", "revenue optimization"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body className="min-h-screen bg-background antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
