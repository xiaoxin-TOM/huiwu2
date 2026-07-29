"use client";

import { useState } from "react";
import { contactQrCards, type ContactInfoLike } from "@/lib/meeting-contact";

/**
 * 结构化联系方式展示。电话可直接拨号、微信号一键复制，
 * 二维码点击放大——手机上放大后才方便长按识别。
 */
export default function ContactInfoBlock({ contact }: { contact: ContactInfoLike & {
  wecomNote: string;
  groupNote: string;
  mpNote: string;
} }) {
  const [zoomed, setZoomed] = useState<{ title: string; url: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const cards = contactQrCards(contact);

  async function copyWechat() {
    try {
      await navigator.clipboard.writeText(contact.wechatId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 复制失败时不打断，用户仍可手动选中文本
    }
  }

  const rows: { label: string; value: string; href?: string; action?: () => void; actionLabel?: string }[] = [];
  if (contact.orgName) rows.push({ label: "主办方", value: contact.orgName });
  if (contact.phone) rows.push({ label: "联系电话", value: contact.phone, href: `tel:${contact.phone}` });
  if (contact.phone2) rows.push({ label: "备用电话", value: contact.phone2, href: `tel:${contact.phone2}` });
  if (contact.email) rows.push({ label: "邮箱", value: contact.email, href: `mailto:${contact.email}` });
  if (contact.wechatId)
    rows.push({
      label: "微信号",
      value: contact.wechatId,
      action: copyWechat,
      actionLabel: copied ? "已复制" : "复制",
    });
  if (contact.address) rows.push({ label: "地址", value: contact.address });

  return (
    <div className="space-y-4">
      {rows.length > 0 && (
        <dl className="divide-y rounded-xl bg-white shadow-sm">
          {rows.map((r) => (
            <div key={r.label} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <dt className="text-sm text-slate-500">{r.label}</dt>
              <dd className="flex items-center gap-2 text-sm font-medium text-slate-800">
                {r.href ? (
                  <a href={r.href} className="text-sky-700 hover:underline">
                    {r.value}
                  </a>
                ) : (
                  <span>{r.value}</span>
                )}
                {r.action && (
                  <button
                    type="button"
                    onClick={r.action}
                    className="rounded border border-slate-200 px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-50"
                  >
                    {r.actionLabel}
                  </button>
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {cards.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          {cards.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setZoomed({ title: c.title, url: c.url })}
              className="rounded-xl bg-white p-4 text-center shadow-sm transition hover:shadow"
            >
              <p className="text-sm font-medium text-slate-800">{c.title}</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.url} alt={c.title} className="mx-auto mt-2 h-36 w-36 object-contain" />
              <p className="mt-1 text-xs text-slate-500">{c.note || "点击放大后长按识别"}</p>
            </button>
          ))}
        </div>
      )}

      {zoomed && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-6"
          role="dialog"
          aria-modal="true"
          aria-label={zoomed.title}
          onClick={() => setZoomed(null)}
        >
          <div className="rounded-2xl bg-white p-5 text-center" onClick={(e) => e.stopPropagation()}>
            <p className="font-medium text-slate-800">{zoomed.title}</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={zoomed.url} alt={zoomed.title} className="mx-auto mt-3 max-h-[70vh] w-64 object-contain" />
            <p className="mt-2 text-xs text-slate-500">长按识别二维码</p>
            <button
              type="button"
              onClick={() => setZoomed(null)}
              className="mt-3 rounded-lg border border-slate-200 px-4 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
