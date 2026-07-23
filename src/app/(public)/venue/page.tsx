import { getPage } from "@/lib/content";
import { parseVenueLocation } from "@/lib/venue";
import { requirePublicMeeting, guardPublicAccess } from "@/lib/public-guard";
import { meetingHref } from "@/lib/public";
import RichText from "@/components/RichText";
import VenueMap from "@/components/VenueMap";
import VenueNavButton from "@/components/VenueNavButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/Card";

export default async function VenuePage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const meeting = await requirePublicMeeting((await searchParams).m);
  await guardPublicAccess(meeting.id);
  const page = await getPage("venue", meeting.id);
  const venue = parseVenueLocation(meeting);
  return (
    <div className="space-y-4">
      <PageHeader title={page?.title ?? "会场交通"} backHref={meetingHref(meeting.id, "/")} />
      <SectionCard>
        {page?.mode === "IMAGE" && page.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={page.imageUrl} alt={page.title} className="w-full rounded-lg" />
        ) : page ? (
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
              <VenueNavButton venue={venue} />
            </div>
            <VenueMap lng={venue.lng} lat={venue.lat} name={venue.name} address={venue.address} />
          </div>
        </SectionCard>
      )}
    </div>
  );
}
