"use client";

import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "xs" | "sm" | "md";

const variants: Record<Variant, string> = {
  primary:
    "rounded-lg bg-sky-700 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-sky-800 disabled:opacity-50",
  secondary:
    "rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50",
  danger:
    "rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-100 disabled:opacity-50",
  ghost: "text-xs text-sky-700 hover:underline disabled:text-slate-400 disabled:no-underline",
};

const sizes: Record<Size, string> = {
  xs: "px-2 py-1 text-xs",
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

export function Button({
  variant = "secondary",
  size = "sm",
  children,
  className = "",
  ...props
}: ButtonProps) {
  const classes = `${variant === "ghost" ? variants.ghost : `${variants[variant]} ${sizes[size]}`} ${className}`;
  return (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  );
}

interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

export function ButtonLink({
  href,
  variant = "secondary",
  size = "sm",
  children,
  className = "",
  ...props
}: ButtonLinkProps) {
  const classes = `${variant === "ghost" ? variants.ghost : `${variants[variant]} ${sizes[size]}`} inline-flex items-center justify-center ${className}`;
  return (
    <Link href={href} className={classes} {...props}>
      {children}
    </Link>
  );
}
