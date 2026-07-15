import Link from "next/link";
import HomeGridIcon from "@/components/HomeGridIcon";
import { homeGridSizeClass, isExternalHomeGridHref } from "@/lib/home-grid-config";
import type { HomeGridItemView } from "@/lib/home-grid";
import { meetingHref } from "@/lib/public";

export default function HomeGrid({
  meetingId,
  items,
  preview = false,
}: {
  meetingId: string;
  items: HomeGridItemView[];
  preview?: boolean;
}) {
  const visibleItems = items.filter((item) => item.isVisible);

  return (
    <div className="grid grid-flow-dense grid-cols-2 auto-rows-[104px] gap-3 sm:grid-cols-4 sm:auto-rows-[120px]">
      {visibleItems.map((item) => {
        const sizeClass = homeGridSizeClass(item.size);
        const large = item.size === "LARGE" || item.size === "TALL";
        const className = `${sizeClass} group relative flex min-h-0 overflow-hidden rounded-2xl border border-sky-100/70 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
          large ? "items-end" : "items-center justify-center"
        }`;
        const content = (
          <>
            {item.backgroundImage && (
              <span
                className="pointer-events-none absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${JSON.stringify(item.backgroundImage)})` }}
                aria-hidden="true"
              />
            )}
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/95 via-white/75 to-sky-100/45" aria-hidden="true" />
            <span className={`relative z-10 flex min-w-0 ${large ? "w-full items-end justify-between gap-3" : "flex-col items-center gap-2 text-center"}`}>
              <span className={`flex shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white shadow-sm transition group-hover:scale-105 ${large ? "h-12 w-12" : "h-10 w-10"}`}>
                <HomeGridIcon icon={item.icon} className={large ? "h-6 w-6" : "h-5 w-5"} />
              </span>
              <span className={`min-w-0 font-bold leading-snug text-sky-800 ${large ? "text-left text-base sm:text-lg" : "text-sm"}`}>
                {item.title}
              </span>
            </span>
          </>
        );

        if (preview) {
          return <div key={item.id} className={className}>{content}</div>;
        }

        if (isExternalHomeGridHref(item.href)) {
          return (
            <a key={item.id} href={item.href} target="_blank" rel="noopener noreferrer" className={className}>
              {content}
            </a>
          );
        }

        return (
          <Link key={item.id} href={meetingHref(meetingId, item.href)} className={className}>
            {content}
          </Link>
        );
      })}
    </div>
  );
}
