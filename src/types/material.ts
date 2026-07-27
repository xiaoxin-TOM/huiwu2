/** 预览组件所需的最小材料信息（不含 OSS key，绝不下发到客户端） */
export type MaterialPreviewMeta = {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  isConfidential: boolean;
  speakerName: string;
};

export type MaterialStatusLabel = "PENDING" | "APPROVED" | "REJECTED";

export const MATERIAL_STATUS_LABEL: Record<string, string> = {
  PENDING: "待审核",
  APPROVED: "已通过",
  REJECTED: "已驳回",
};
