import { getPage } from "@/lib/content";
import { getSiteConfig } from "@/lib/siteconfig";
import { parseVenueLocation, amapNavUrl } from "@/lib/venue";
import { requirePublicMeeting, guardPublicAccess } from "@/lib/public-guard";
import RichText from "@/components/RichText";
import VenueMap from "@/components/VenueMap";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/Card";

export default async function VenuePage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const meeting = await requirePublicMeeting((await searchParams).m);
  await guardPublicAccess(meeting.id);
  const [page, cfg] = await Promise.all([getPage("venue", meeting.id), getSiteConfig()]);
  const venue = parseVenueLocation(cfg);
  return (
    <div className="space-y-4">
      <PageHeader title={page?.title ?? "会场交通"} />
      <SectionCard>
        {page ? (
          <div className="prose max-w-none text-slate-600">
            <RichText html={page.contentHtml} />
          </div>
        ) : (
          <p className="text-slate-500">交通信息待发布。</p>
        )}
      </SectionCard>
      {venue && (
        <SectionCard>
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-semibold text-slate-800">{venue.name}</h2>
                {venue.address && <p className="text-sm text-slate-500">{venue.address}</p>}
              </div>
              <a
                href={amapNavUrl(venue)}
                target="_blank"
                rel="noreferrer"
                className="rounded bg-sky-700 px-4 py-2 text-sm text-white hover:bg-sky-800"
              >
                🧭 导航到会场
              </a>
            </div>
            <VenueMap lng={venue.lng} lat={venue.lat} name={venue.name} address={venue.address} />
          </div>
        </SectionCard>
      )}
    </div>
  );
}
