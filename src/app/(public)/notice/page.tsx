import SimpleContentPage from "@/components/SimpleContentPage";

export default async function NoticePage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  return (
    <SimpleContentPage
      slug="notice"
      fallbackTitle="活动须知"
      emptyText="活动须知待发布。"
      m={(await searchParams).m}
    />
  );
}
