"use client";

import { type ReactNode } from "react";
import { motion } from "framer-motion";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-neon-green/15 text-neon-green border border-neon-green/30 glow-green hover:bg-neon-green/25 active:bg-neon-green/30",
  secondary:
    "bg-surface text-foreground border border-border hover:bg-surface-light active:bg-card-hover",
  danger:
    "bg-neon-red/15 text-neon-red border border-neon-red/30 glow-red hover:bg-neon-red/25 active:bg-neon-red/30",
  ghost:
    "bg-transparent text-foreground hover:bg-surface-light active:bg-surface border border-transparent",
};

const sizeStyles: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs rounded-lg",
  md: "px-5 py-2.5 text-sm rounded-xl",
  lg: "px-7 py-3.5 text-base rounded-xl",
};

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  onClick,
  disabled,
  type = "button",
}: ButtonProps) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className={`inline-flex items-center justify-center font-medium transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:pointer-events-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </motion.button>
  );
}
