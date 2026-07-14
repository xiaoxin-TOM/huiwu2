"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

interface SpeakerAcceptButtonProps {
  token: string;
}

export default function SpeakerAcceptButton({ token }: SpeakerAcceptButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleAccept() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/speakers/${token}/accept`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setDone(true);
        setTimeout(() => router.push("/me"), 1500);
      } else {
        setError(data.error || "接受邀约失败");
      }
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return <p className="rounded-lg bg-emerald-100 py-3 text-emerald-700">接受成功，即将跳转个人中心…</p>;
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button onClick={handleAccept} disabled={loading} variant="primary" size="md">
        {loading ? "提交中..." : "接受邀约"}
      </Button>
    </div>
  );
}
