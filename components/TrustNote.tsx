"use client";

import { Shield, Lock, Info, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type TrustVariant =
  | "simulation"   // "Simulation only — does not affect your current system"
  | "privacy"      // "Your data is private and scoped to your business only"
  | "methodology"  // "Based on real-world HVAC dispatch optimization models"
  | "security"     // "256-bit encrypted, SOC2-aligned data handling"
  | "noCommitment" // "No setup required · Cancel anytime"
  | "custom";

interface TrustNoteProps {
  variant?: TrustVariant;
  message?: string;               // required when variant="custom"
  size?: "xs" | "sm";
  className?: string;
  icon?: boolean;
}

const VARIANTS: Record<TrustVariant, { icon: React.ElementType; message: string }> = {
  simulation: {
    icon: Info,
    message: "Simulation only — does not modify your current dispatch system",
  },
  privacy: {
    icon: Lock,
    message: "Your data is private and scoped to your business only. Never shared.",
  },
  methodology: {
    icon: CheckCircle,
    message: "Based on real-world HVAC dispatch optimization models. Results vary by fleet size and job mix.",
  },
  security: {
    icon: Shield,
    message: "256-bit encrypted storage. Your operational data never leaves your account.",
  },
  noCommitment: {
    icon: CheckCircle,
    message: "No setup required · No credit card · Cancel anytime",
  },
  custom: {
    icon: Info,
    message: "",
  },
};

export function TrustNote({
  variant = "simulation",
  message,
  size = "xs",
  className,
  icon = true,
}: TrustNoteProps) {
  const config = VARIANTS[variant];
  const IconComponent = config.icon;
  const text = variant === "custom" ? (message ?? "") : config.message;

  return (
    <div
      className={cn(
        "flex items-start gap-1.5",
        size === "xs" ? "text-[10px]" : "text-xs",
        "text-zinc-500",
        className
      )}
    >
      {icon && (
        <IconComponent
          className={cn(
            "flex-shrink-0 mt-px",
            size === "xs" ? "w-3 h-3" : "w-3.5 h-3.5",
            "text-zinc-600"
          )}
        />
      )}
      <span className="leading-relaxed font-mono">{text}</span>
    </div>
  );
}

// Inline bar variant — used above forms and result panels
export function TrustBar({ items }: { items: TrustVariant[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
      {items.map((v) => (
        <TrustNote key={v} variant={v} size="xs" />
      ))}
    </div>
  );
}
