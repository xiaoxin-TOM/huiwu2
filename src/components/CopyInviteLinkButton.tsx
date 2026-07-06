"use client";

export default function CopyInviteLinkButton({ token }: { token: string }) {
  async function handleClick() {
    const url = `${window.location.origin}/g/${token}`;
    await navigator.clipboard.writeText(url);
    alert("邀请链接已复制");
  }

  return (
    <button type="button" onClick={handleClick} className="text-sky-700 hover:underline">
      复制邀请链接
    </button>
  );
}
