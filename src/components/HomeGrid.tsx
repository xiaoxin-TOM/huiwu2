import Link from "next/link";
import HomeGridIcon from "@/components/HomeGridIcon";
import { homeGridSizeClass, isExternalHomeGridHref, type HomeGridColumns } from "@/lib/home-grid-config";
import type { HomeGridItemView } from "@/lib/home-grid";
import { meetingHref } from "@/lib/public";

const CELL_SIZE: Record<HomeGridColumns, string> = {
  2: "min(30vw, 270px)",
  3: "min(24vw, 270px)",
  4: "min(17vw, 270px)",
};

export default function HomeGrid({
  meetingId,
  items,
  columns = 4,
  preview = false,
}: {
  meetingId: string;
  items: HomeGridItemView[];
  columns?: HomeGridColumns;
  preview?: boolean;
}) {
  const visibleItems = items.filter((item) => item.isVisible);
  const cellSize = CELL_SIZE[columns] ?? CELL_SIZE[4];

  return (
    <div
      className="grid grid-flow-dense justify-center gap-10"
      style={{ gridTemplateColumns: `repeat(${columns}, ${cellSize})`, gridAutoRows: cellSize }}
    >
      {visibleItems.map((item) => {
        const sizeClass = homeGridSizeClass(item.size);
        const large = item.size === "LARGE" || item.size === "TALL";
        const className = `${sizeClass} group relative flex h-full w-full min-h-0 overflow-hidden rounded-2xl border border-sky-100/70 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md items-center justify-center`;
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
            <span className={`relative z-10 flex min-w-0 flex-col items-center text-center ${large ? "gap-3" : "gap-2"}`}>
              <span className={`flex shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white shadow-sm transition group-hover:scale-105 ${large ? "h-12 w-12" : "h-10 w-10"}`}>
                <HomeGridIcon icon={item.icon} className={large ? "h-6 w-6" : "h-5 w-5"} />
              </span>
              <span className={`min-w-0 font-bold leading-snug text-sky-800 ${large ? "text-base" : "text-sm"}`}>
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
