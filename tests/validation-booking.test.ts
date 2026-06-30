import { expect, test } from "vitest";
import { bookingSchema } from "@/lib/validation";

test("合法预订通过,rooms 字符串被强转为数字", () => {
  const r = bookingSchema.safeParse({
    hotelId: "h1", checkIn: "2026-09-18", checkOut: "2026-09-20", rooms: "2",
  });
  expect(r.success).toBe(true);
  if (r.success) expect(r.data.rooms).toBe(2);
});

test("离店不晚于入住时失败", () => {
  const r = bookingSchema.safeParse({
    hotelId: "h1", checkIn: "2026-09-20", checkOut: "2026-09-18", rooms: 1,
  });
  expect(r.success).toBe(false);
});

test("rooms < 1 失败", () => {
  expect(bookingSchema.safeParse({
    hotelId: "h1", checkIn: "2026-09-18", checkOut: "2026-09-20", rooms: 0,
  }).success).toBe(false);
});
