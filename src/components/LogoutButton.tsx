"use client";

import { signOut } from "next-auth/react";
import { LogOutIcon } from "@/components/icons";

interface LogoutButtonProps {
  variant?: "dark" | "light";
}

export default function LogoutButton({ variant = "dark" }: LogoutButtonProps) {
  const base =
    "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition";
  const styles =
    variant === "dark"
      ? "bg-slate-800 text-white hover:bg-slate-700"
      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50";

  return (
    <button
      type="button"
      onClick={() => {
        const callbackUrl = typeof window !== "undefined"
          ? `${window.location.origin}/login`
          : "/login";
        signOut({ callbackUrl, redirect: true });
      }}
      className={`${base} ${styles}`}
    >
      <LogOutIcon className="h-4 w-4" />
      退出登录
    </button>
  );
}
