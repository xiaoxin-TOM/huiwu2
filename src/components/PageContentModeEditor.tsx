"use client";

import { useState } from "react";
import RichTextEditor from "@/components/RichTextEditor";
import ImageUploadField from "@/components/ImageUploadField";

export default function PageContentModeEditor({
  defaultMode = "TEXT",
  defaultContentHtml = "",
  defaultImageUrl = "",
}: {
  defaultMode?: string;
  defaultContentHtml?: string;
  defaultImageUrl?: string;
}) {
  const [mode, setMode] = useState<"TEXT" | "IMAGE">(defaultMode === "IMAGE" ? "IMAGE" : "TEXT");

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-sm text-slate-600">
        <label className="flex items-center gap-1.5">
          <input
            type="radio"
            name="mode"
            value="TEXT"
            checked={mode === "TEXT"}
            onChange={() => setMode("TEXT")}
          />
          富文本
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="radio"
            name="mode"
            value="IMAGE"
            checked={mode === "IMAGE"}
            onChange={() => setMode("IMAGE")}
          />
          一图流（用一张图片代替内容）
        </label>
      </div>

      <div className={mode === "TEXT" ? "" : "hidden"}>
        <RichTextEditor defaultValue={defaultContentHtml} />
      </div>
      <div className={mode === "IMAGE" ? "" : "hidden"}>
        <ImageUploadField name="imageUrl" defaultValue={defaultImageUrl} label="内容图片" />
      </div>
    </div>
  );
}
