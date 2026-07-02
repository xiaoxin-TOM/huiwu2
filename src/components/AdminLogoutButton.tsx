"use client";

import { signOut } from "next-auth/react";
import { LogOutIcon } from "@/components/icons";

export default function AdminLogoutButton() {
  return (
    <button
      type="button"
      onClick={() => {
        const callbackUrl = typeof window !== "undefined"
          ? `${window.location.origin}/login`
          : "/login";
        signOut({ callbackUrl, redirect: true });
      }}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/80 transition hover:bg-white/15 hover:text-white"
    >
      <LogOutIcon className="h-5 w-5" />
      <span>退出登录</span>
    </button>
  );
}
