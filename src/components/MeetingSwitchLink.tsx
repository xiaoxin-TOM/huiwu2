"use client";

import { useRouter } from "next/navigation";

export default function MeetingSwitchLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        router.push(href);
        router.refresh();
      }}
      className={className}
    >
      {children}
    </button>
  );
}
