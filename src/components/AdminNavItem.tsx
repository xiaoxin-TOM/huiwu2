"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { IconProps } from "@/components/icons";

interface AdminNavItemProps {
  href: string;
  label: string;
  icon: (props?: IconProps) => React.ReactNode;
  disabled?: boolean;
}

function itemClass(active: boolean, disabled: boolean) {
  const base =
    "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-left transition";
  if (disabled) {
    return `${base} cursor-not-allowed text-white/40`;
  }
  if (active) {
    return `${base} bg-white/20 font-medium text-white`;
  }
  return `${base} text-white/90 hover:bg-white/15 hover:text-white`;
}

export default function AdminNavItem({ href, label, icon: Icon, disabled }: AdminNavItemProps) {
  const pathname = usePathname();
  const active = href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);

  if (disabled) {
    return (
      <button type="button" disabled className={itemClass(active, true)}>
        <span className="opacity-60">{Icon({ className: "h-5 w-5" })}</span>
        <span>{label}</span>
      </button>
    );
  }

  return (
    <Link href={href} className={itemClass(active, false)}>
      <span className="opacity-80 group-hover:opacity-100">{Icon({ className: "h-5 w-5" })}</span>
      <span>{label}</span>
    </Link>
  );
}
