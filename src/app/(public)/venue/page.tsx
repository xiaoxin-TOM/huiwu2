import { getPage } from "@/lib/content";
import RichText from "@/components/RichText";

export default async function VenuePage() {
  const page = await getPage("venue");
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">{page?.title ?? "会场交通"}</h1>
      {page ? (
        <RichText html={page.contentHtml} />
      ) : (
        <p className="text-gray-500">交通信息待发布。</p>
      )}
    </section>
  );
}
