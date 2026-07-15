import SimpleContentPage from "@/components/SimpleContentPage";

export default async function GuidePage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  return (
    <SimpleContentPage
      slug="guide"
      fallbackTitle="活动说明"
      emptyText="活动说明待发布。"
      m={(await searchParams).m}
    />
  );
}
