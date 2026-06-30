import { getPage } from "@/lib/content";
import RichText from "@/components/RichText";

export default async function ContactPage() {
  const page = await getPage("contact");
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">{page?.title ?? "联系方式"}</h1>
      {page ? (
        <RichText html={page.contentHtml} />
      ) : (
        <p className="text-gray-500">联系方式待发布。</p>
      )}
    </section>
  );
}
