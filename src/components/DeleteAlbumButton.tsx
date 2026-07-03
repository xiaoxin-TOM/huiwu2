"use client";

import AdminForm from "@/components/AdminForm";
import { TrashIcon } from "@/components/icons";

export default function DeleteAlbumButton({ albumId, albumTitle }: { albumId: string; albumTitle: string }) {
  return (
    <AdminForm action={`/api/admin/albums/${albumId}/delete`} redirectTo="/admin/albums">
      <button
        type="submit"
        onClick={(e) => {
          if (!confirm(`确定要删除相册“${albumTitle}”吗？相册内的所有照片也将被一并删除，此操作不可恢复。`)) {
            e.preventDefault();
          }
        }}
        className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100"
      >
        <TrashIcon className="h-3.5 w-3.5" />
        删除相册
      </button>
    </AdminForm>
  );
}
