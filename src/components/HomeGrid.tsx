import Link from "next/link";
import type { CSSProperties } from "react";
import HomeGridIcon from "@/components/HomeGridIcon";
import { homeGridSizeClass, isExternalHomeGridHref, type HomeGridColumns } from "@/lib/home-grid-config";
import type { HomeGridItemView } from "@/lib/home-grid";
import { meetingHref } from "@/lib/public";

const GAP: Record<HomeGridColumns, number> = {
  2: 20,
  3: 16,
  4: 8,
};

const PREVIEW_GAP: Record<HomeGridColumns, number> = {
  2: 12,
  3: 10,
  4: 6,
};

const MAX_CELL: Record<HomeGridColumns, number> = {
  2: 300,
  3: 270,
  4: 270,
};

const PREVIEW_MAX_CELL: Record<HomeGridColumns, number> = {
  2: 100,
  3: 90,
  4: 85,
};

export default function HomeGrid({
  meetingId,
  items,
  columns = 4,
  rounded = true,
  preview = false,
}: {
  meetingId: string;
  items: HomeGridItemView[];
  columns?: HomeGridColumns;
  rounded?: boolean;
  preview?: boolean;
}) {
  const visibleItems = items.filter((item) => item.isVisible);
  const gap = preview ? PREVIEW_GAP[columns] : GAP[columns];
  const maxCell = preview ? PREVIEW_MAX_CELL[columns] : MAX_CELL[columns];
  const radiusClass = rounded ? "rounded-2xl" : "rounded-none";

  const cellValue = `min(${maxCell}px, calc((100cqw - ${(columns - 1) * gap}px) / ${columns}))`;
  const gridStyle: CSSProperties & Record<string, string | number> = {
    width: "100%",
    "--cell": cellValue,
    "--gap": `${gap}px`,
    gridTemplateColumns: `repeat(${columns}, var(--cell))`,
    gridAutoRows: `var(--cell)`,
    gap: "var(--gap)",
  };

  return (
    <div className="w-full" style={{ containerType: "inline-size" }}>
      <div
        className="grid grid-flow-dense justify-center"
        style={gridStyle}
      >
      {visibleItems.map((item) => {
        const sizeClass = homeGridSizeClass(item.size);
        const large = item.size === "LARGE" || item.size === "TALL";
        const blankIcon = item.icon === "blank";
        const className = `${sizeClass} ${radiusClass} group relative flex h-full w-full min-h-0 overflow-hidden border border-sky-100/70 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md items-center justify-center ${blankIcon ? "" : "p-2"}`;
        const content = (
          <>
            {item.backgroundImage && (
              <span
                className="pointer-events-none absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${JSON.stringify(item.backgroundImage)})` }}
                aria-hidden="true"
              />
            )}
            {!blankIcon && (
              <span className={`relative z-10 flex min-w-0 flex-col items-center text-center ${large ? "gap-2" : "gap-1"}`}>
                <span className={`flex shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white shadow-sm transition group-hover:scale-105 ${large ? "h-8 w-8" : "h-6 w-6"} ${preview ? "scale-75" : ""}`}>
                  <HomeGridIcon icon={item.icon} className={`${large ? (preview ? "h-3.5 w-3.5" : "h-4 w-4") : (preview ? "h-3 w-3" : "h-3.5 w-3.5")}`} />
                </span>
                <span className={`min-w-0 font-bold leading-snug text-sky-800 ${large ? (preview ? "text-[9px]" : "text-[10px]") : (preview ? "text-[8px]" : "text-[9px]")}`}>
                  {item.title}
                </span>
              </span>
            )}
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
    </div>
  );
}
