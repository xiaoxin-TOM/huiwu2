"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useState } from "react";
import { isRichHtml, plainTextToHtml } from "@/lib/richtext";

/** 富文本编辑器:在 AdminForm(原生 FormData 提交)内以隐藏 input 携带 HTML。 */
export default function RichTextEditor({
  name = "contentHtml",
  defaultValue = "",
}: {
  name?: string;
  defaultValue?: string;
}) {
  const [html, setHtml] = useState(() =>
    isRichHtml(defaultValue) ? defaultValue : plainTextToHtml(defaultValue),
  );
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: { openOnClick: false },
        codeBlock: false,
        code: false,
        horizontalRule: false,
      }),
    ],
    content: html,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose max-w-none min-h-[240px] px-3 py-2 focus:outline-none",
      },
    },
    onUpdate({ editor }) {
      setHtml(editor.isEmpty ? "" : editor.getHTML());
    },
  });

  return (
    <div className="rounded border">
      {editor && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
      <input type="hidden" name={name} value={html} />
    </div>
  );
}

function ToolbarButton({
  label,
  title,
  active = false,
  disabled = false,
  onClick,
}: {
  label: string;
  title: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`rounded px-2 py-1 text-sm transition disabled:opacity-40 ${
        active ? "bg-sky-100 text-sky-700" : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      {label}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  function setLink() {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("链接地址(http/https):", prev ?? "https://");
    if (url === null) return;
    if (url === "" || url === "https://") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  return (
    <div className="flex flex-wrap gap-1 border-b bg-slate-50 px-2 py-1.5">
      <ToolbarButton label="B" title="加粗" active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()} />
      <ToolbarButton label="I" title="斜体" active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()} />
      <ToolbarButton label="S" title="删除线" active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()} />
      <ToolbarButton label="H2" title="大标题" active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
      <ToolbarButton label="H3" title="小标题" active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} />
      <ToolbarButton label="• 列表" title="无序列表" active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()} />
      <ToolbarButton label="1. 列表" title="有序列表" active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()} />
      <ToolbarButton label="引用" title="引用" active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()} />
      <ToolbarButton label="链接" title="插入/编辑链接(留空取消)" active={editor.isActive("link")}
        onClick={setLink} />
      <span className="mx-1 w-px self-stretch bg-slate-200" />
      <ToolbarButton label="撤销" title="撤销" disabled={!editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()} />
      <ToolbarButton label="重做" title="重做" disabled={!editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()} />
    </div>
  );
}
