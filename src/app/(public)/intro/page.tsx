import SimpleContentPage from "@/components/SimpleContentPage";

export default async function IntroPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  return (
    <SimpleContentPage
      slug="intro"
      fallbackTitle="活动简介"
      emptyText="活动简介待发布。"
      m={(await searchParams).m}
    />
  );
}
