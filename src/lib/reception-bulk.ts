/**
 * 接待信息批量设置的纯逻辑——不依赖 Prisma 与 Next 运行时，可独立单测。
 *
 * 语义：调用方只传"勾选过"的字段（键存在即视为勾选）。
 * - 勾选且填值 → 写入该值
 * - 勾选但留空 → 覆盖模式下清空该字段，仅填空白模式下不动
 * 房间号（hotelRoom）天然逐人不同，刻意排除在批量之外。
 */

export const RECEPTION_BULK_FIELDS = [
  "arriveMode",
  "arriveNo",
  "arriveTime",
  "arrivePlace",
  "departMode",
  "departNo",
  "departTime",
  "hotelName",
  "hotelCheckIn",
  "hotelCheckOut",
  "carPlate",
  "carDriver",
  "carDriverPhone",
  "carContact",
  "remark",
] as const;

export type ReceptionBulkField = (typeof RECEPTION_BULK_FIELDS)[number];

export type ReceptionBulkValues = Partial<Record<ReceptionBulkField, string>>;

export const RECEPTION_BULK_MODES = ["FILL_EMPTY", "OVERWRITE"] as const;

export type ReceptionBulkMode = (typeof RECEPTION_BULK_MODES)[number];

export const RECEPTION_BULK_FIELD_GROUPS: {
  group: string;
  fields: { key: ReceptionBulkField; label: string; multiline?: boolean }[];
}[] = [
  {
    group: "抵达",
    fields: [
      { key: "arriveMode", label: "抵达方式" },
      { key: "arriveNo", label: "抵达班次" },
      { key: "arriveTime", label: "抵达时间" },
      { key: "arrivePlace", label: "抵达地点" },
    ],
  },
  {
    group: "返程",
    fields: [
      { key: "departMode", label: "返程方式" },
      { key: "departNo", label: "返程班次" },
      { key: "departTime", label: "返程时间" },
    ],
  },
  {
    group: "酒店",
    fields: [
      { key: "hotelName", label: "酒店名称" },
      { key: "hotelCheckIn", label: "入住日期" },
      { key: "hotelCheckOut", label: "退房日期" },
    ],
  },
  {
    group: "用车",
    fields: [
      { key: "carPlate", label: "车牌号" },
      { key: "carDriver", label: "司机" },
      { key: "carDriverPhone", label: "司机电话" },
      { key: "carContact", label: "接待联系人" },
    ],
  },
  {
    group: "其他",
    fields: [{ key: "remark", label: "接待备注", multiline: true }],
  },
];

const BULK_FIELD_SET = new Set<string>(RECEPTION_BULK_FIELDS);

export function isReceptionBulkField(key: string): key is ReceptionBulkField {
  return BULK_FIELD_SET.has(key);
}

/**
 * 算出某条接待记录需要实际写入的字段。返回空对象表示该行无需更新。
 */
export function computeReceptionPatch(
  existing: ReceptionBulkValues | null,
  fields: ReceptionBulkValues,
  mode: ReceptionBulkMode,
): ReceptionBulkValues {
  const patch: ReceptionBulkValues = {};
  for (const key of RECEPTION_BULK_FIELDS) {
    if (!(key in fields)) continue;
    const next = fields[key] ?? "";
    const current = existing?.[key] ?? "";
    // 仅填空白项：已有非空值的字段一律不动
    if (mode === "FILL_EMPTY" && current.trim() !== "") continue;
    if (current === next) continue;
    patch[key] = next;
  }
  return patch;
}
