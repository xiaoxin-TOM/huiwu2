"use client";

import { useState } from "react";
import AdminForm from "@/components/AdminForm";
import PageContentModeEditor from "@/components/PageContentModeEditor";
import { ButtonLink } from "@/components/ui/Button";

interface NoticeEditorProps {
  notice?: {
    id?: string;
    title: string;
    contentHtml: string;
    isPublished: boolean;
    mode?: string | null;
    imageUrl?: string | null;
  };
  redirectTo?: string;
}

export default function NoticeEditor({ notice, redirectTo = "/admin/pages" }: NoticeEditorProps) {
  const isNew = !notice?.id;
  const [title, setTitle] = useState(notice?.title ?? "");
  const [isPublished, setIsPublished] = useState(notice?.isPublished ?? true);

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{isNew ? "新建通知" : "编辑通知"}</h1>
        <ButtonLink href={redirectTo} variant="secondary" size="sm">
          返回内容页
        </ButtonLink>
      </div>

      <AdminForm
        action={isNew ? "/api/admin/notices" : `/api/admin/notices/${notice.id}`}
        redirectTo={redirectTo}
        className="space-y-3 rounded border p-4"
      >
        <label className="block text-sm text-gray-600">
          标题
          <input
            name="title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>

        <div className="block text-sm text-gray-600">
          正文
          <div className="mt-1">
            <PageContentModeEditor
              defaultMode={notice?.mode ?? "TEXT"}
              defaultContentHtml={notice?.contentHtml ?? ""}
              defaultImageUrl={notice?.imageUrl ?? ""}
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            name="isPublished"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
          />
          立即发布
        </label>

        <div className="flex flex-wrap gap-3 pt-2">
          <button type="submit" className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-800">
            保存
          </button>
          <ButtonLink href={redirectTo} variant="secondary" size="sm">
            取消
          </ButtonLink>
        </div>
      </AdminForm>
    </div>
  );
}
