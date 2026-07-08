"use client";

import { useState } from "react";

export function CopyRegistrationLink({ meetingId }: { meetingId: string }) {
  const [copied, setCopied] = useState(false);
  const url = `${typeof window !== "undefined" ? window.location.origin : ""}/r/${meetingId}`;

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="text-xs text-sky-700 hover:underline"
      title={url}
    >
      {copied ? "已复制" : "复制报名链接"}
    </button>
  );
}
