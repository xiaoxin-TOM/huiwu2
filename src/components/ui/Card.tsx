"use client";

import Link from "next/link";
import { safeHtml } from "@/lib/html";
import { ChevronRightIcon } from "@/components/icons";

export interface IconCardProps {
  href?: string;
  onClick?: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  className?: string;
  variant?: "default" | "compact" | "large";
  bgImage?: string;
}

export function IconCard({
  href,
  onClick,
  icon,
  title,
  subtitle,
  className = "",
  variant = "default",
  bgImage,
}: IconCardProps) {
  const hasImage = Boolean(bgImage);
  const base = hasImage
    ? "group relative flex aspect-square flex-col items-center justify-center overflow-hidden rounded-2xl border border-sky-100/50 p-5 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
    : "group flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white p-5 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]";

  const sizes = {
    compact: "gap-2 p-4",
    default: "gap-3 p-5",
    large: "gap-4 p-6",
  };

  const iconSizes = {
    compact: "h-9 w-9 p-2",
    default: "h-11 w-11 p-2.5",
    large: "h-14 w-14 p-3",
  };

  const titleSizes = {
    compact: "text-xs",
    default: "text-sm",
    large: "text-base",
  };

  const content = (
    <>
      {hasImage && (
        <>
          <span
            className="pointer-events-none absolute inset-0 bg-no-repeat"
            style={{ backgroundImage: `url('${bgImage}')`, backgroundSize: "100% 100%", backgroundPosition: "center" }}
            aria-hidden="true"
          />
          <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/30 to-sky-50/20" aria-hidden="true" />
        </>
      )}
      <div
        className={`relative z-10 flex items-center justify-center rounded-xl transition ${
          hasImage
            ? "bg-sky-600/90 text-white shadow-sm group-hover:scale-105"
            : "bg-sky-100 text-sky-600 group-hover:bg-sky-600 group-hover:text-white"
        } ${iconSizes[variant]}`}
      >
        {icon}
      </div>
      <div className="relative z-10 min-w-0">
        <div className={`font-bold leading-snug ${hasImage ? "text-sky-700" : "text-slate-700"} ${titleSizes[variant]}`}>
          {title}
        </div>
        {subtitle && (
          <div className={`mt-1 text-xs ${hasImage ? "text-sky-600/80 drop-shadow-sm" : "text-slate-400"}`}>{subtitle}</div>
        )}
      </div>
    </>
  );

  const classes = `${base} ${sizes[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={classes}>
      {content}
    </button>
  );
}

export interface DataCardProps {
  href?: string;
  title: string;
  meta?: string;
  description?: string;
  htmlDescription?: string;
  imageUrl?: string | null;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function DataCard({
  href,
  title,
  meta,
  description,
  htmlDescription,
  imageUrl,
  icon,
  action,
  className = "",
}: DataCardProps) {
  const content = (
    <>
      <div className="flex items-start gap-4">
        {imageUrl ? (
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
          </div>
        ) : icon ? (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
            {icon}
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-slate-800">{title}</h3>
            {href && <ChevronRightIcon className="h-5 w-5 shrink-0 text-slate-300" />}
          </div>
          {meta && <p className="mt-0.5 text-xs text-slate-400">{meta}</p>}
          {description && <p className="mt-2 line-clamp-2 text-sm text-slate-500">{description}</p>}
          {htmlDescription && (
            <div
              className="prose prose-sm mt-2 line-clamp-3 max-w-none text-slate-500"
              dangerouslySetInnerHTML={{ __html: safeHtml(htmlDescription) }}
            />
          )}
        </div>
      </div>
      {action && <div className="mt-4 flex justify-end">{action}</div>}
    </>
  );

  const classes = `block rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:shadow-md ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return <div className={classes}>{content}</div>;
}

export function CardGrid({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 ${className}`}>{children}</div>;
}

export function SectionCard({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-slate-100 bg-white p-5 shadow-sm ${className}`}>
      {title && <h2 className="mb-4 text-lg font-bold text-slate-800">{title}</h2>}
      {children}
    </section>
  );
}

export function FormCard({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-slate-100 bg-white p-5 shadow-sm ${className}`}>
      {title && <h2 className="mb-4 text-lg font-bold text-slate-800">{title}</h2>}
      {children}
    </div>
  );
}

export const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100";

export const buttonClass =
  "w-full rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-sky-700 disabled:opacity-50";

export const selectClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100";

export const labelClass = "mb-1.5 block text-sm font-medium text-slate-600";
