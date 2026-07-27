import { expect, test } from "vitest";
import {
  RECEPTION_BULK_FIELDS,
  computeReceptionPatch,
  type ReceptionBulkValues,
} from "@/lib/reception-bulk";

const empty = null;

test("未勾选的字段不参与写入", () => {
  const patch = computeReceptionPatch(empty, { hotelName: "锦江国际" }, "OVERWRITE");
  expect(patch).toEqual({ hotelName: "锦江国际" });
  expect(Object.keys(patch)).toHaveLength(1);
});

test("仅填空白项模式下跳过已有值的字段", () => {
  const existing = { hotelName: "已安排酒店", carDriver: "" };
  const fields: ReceptionBulkValues = { hotelName: "锦江国际", carDriver: "王司机" };
  const patch = computeReceptionPatch(existing, fields, "FILL_EMPTY");
  expect(patch).toEqual({ carDriver: "王司机" });
});

test("覆盖已有值模式下连同已有值一起改写", () => {
  const existing = { hotelName: "已安排酒店", carDriver: "" };
  const fields: ReceptionBulkValues = { hotelName: "锦江国际", carDriver: "王司机" };
  const patch = computeReceptionPatch(existing, fields, "OVERWRITE");
  expect(patch).toEqual({ hotelName: "锦江国际", carDriver: "王司机" });
});

test("仅由空白构成的已有值视为空，可被填充", () => {
  const patch = computeReceptionPatch({ hotelName: "   " }, { hotelName: "锦江国际" }, "FILL_EMPTY");
  expect(patch).toEqual({ hotelName: "锦江国际" });
});

test("值未发生变化时不产生补丁", () => {
  const patch = computeReceptionPatch({ hotelName: "锦江国际" }, { hotelName: "锦江国际" }, "OVERWRITE");
  expect(patch).toEqual({});
});

test("勾选后留空即在覆盖模式下清空该字段", () => {
  const patch = computeReceptionPatch({ carPlate: "京A12345" }, { carPlate: "" }, "OVERWRITE");
  expect(patch).toEqual({ carPlate: "" });
});

test("勾选后留空在仅填空白模式下不清空已有值", () => {
  const patch = computeReceptionPatch({ carPlate: "京A12345" }, { carPlate: "" }, "FILL_EMPTY");
  expect(patch).toEqual({});
});

test("尚无接待记录时所有勾选字段都会写入", () => {
  const fields: ReceptionBulkValues = { hotelName: "锦江国际", hotelCheckIn: "2026-08-11" };
  expect(computeReceptionPatch(empty, fields, "FILL_EMPTY")).toEqual(fields);
  expect(computeReceptionPatch(empty, fields, "OVERWRITE")).toEqual(fields);
});

test("房间号不在批量字段内", () => {
  expect(RECEPTION_BULK_FIELDS).not.toContain("hotelRoom");
  const patch = computeReceptionPatch(
    { hotelRoom: "801" } as ReceptionBulkValues,
    { hotelRoom: "999" } as ReceptionBulkValues,
    "OVERWRITE",
  );
  expect(patch).toEqual({});
});
