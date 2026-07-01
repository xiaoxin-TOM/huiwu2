"use client";
import { useState } from "react";
import Link from "next/link";

type NavItem = { href: string; label: string };

export default function MobileNav({
  items,
  accountHref,
  accountLabel,
}: {
  items: NavItem[];
  accountHref: string;
  accountLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label="菜单"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-11 w-11 items-center justify-center rounded text-gray-700 hover:bg-gray-100"
      >
        <span className="text-2xl leading-none">{open ? "✕" : "☰"}</span>
      </button>

      {open && (
        <nav className="absolute left-0 right-0 top-full z-20 flex flex-col border-b bg-white shadow-sm">
          {items.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={close}
              className="px-4 py-3 text-gray-700 hover:bg-gray-50"
            >
              {n.label}
            </Link>
          ))}
          <Link
            href={accountHref}
            onClick={close}
            className="border-t px-4 py-3 font-medium text-sky-700 hover:bg-gray-50"
          >
            {accountLabel}
          </Link>
        </nav>
      )}
    </div>
  );
}
