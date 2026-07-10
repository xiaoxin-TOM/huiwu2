"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface SpeakerInviteButtonProps {
  speakerId: string;
}

export default function SpeakerInviteButton({ speakerId }: SpeakerInviteButtonProps) {
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleInvite() {
    setLoading(true);
    setError("");
    setLink("");
    setCopied(false);
    try {
      const res = await fetch(`/api/admin/speakers/${speakerId}/invite`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.link) {
        setLink(data.link);
      } else {
        setError(data.error || "生成链接失败");
      }
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("复制失败，请手动复制");
    }
  }

  return (
    <div className="inline-flex flex-col gap-2">
      <Button onClick={handleInvite} disabled={loading} variant="secondary" size="xs">
        {loading ? "生成中..." : "邀约认证"}
      </Button>
      {error && <span className="text-xs text-red-600">{error}</span>}
      {link && (
        <div className="flex max-w-xs items-center gap-2 rounded border bg-slate-50 px-2 py-1">
          <input
            readOnly
            value={link}
            className="w-full bg-transparent text-xs text-slate-700 outline-none"
          />
          <Button onClick={handleCopy} variant="ghost" size="xs">
            {copied ? "已复制" : "复制"}
          </Button>
        </div>
      )}
    </div>
  );
}
