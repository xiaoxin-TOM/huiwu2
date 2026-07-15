"use client";

import { useState } from "react";

export function CopyRegistrationLink({ meetingId }: { meetingId: string }) {
  const [copied, setCopied] = useState(false);
  const relativeUrl = `/r/${meetingId}`;

  async function handleClick() {
    const fullUrl = `${window.location.origin}${relativeUrl}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
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
      title={relativeUrl}
    >
      {copied ? "已复制" : "复制报名链接"}
    </button>
  );
}
