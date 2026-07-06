import { afterAll, beforeAll, expect, test } from "vitest";
import { prisma } from "@/lib/prisma";
import { getHotel } from "@/lib/hotels";
import { createHotel, updateHotel, deleteHotel } from "@/lib/hotels-admin";

const ids: string[] = [];
let meetingId: string;

beforeAll(async () => {
  const m = await prisma.meeting.create({ data: { title: "酒店测试会议" } });
  meetingId = m.id;
});

afterAll(async () => {
  await prisma.hotel.deleteMany({ where: { id: { in: ids } } });
  await prisma.meeting.delete({ where: { id: meetingId } }).catch(() => {});
  await prisma.$disconnect();
});

test("建→改→删 酒店", async () => {
  const h = await createHotel(meetingId, {
    name: "测试酒店", description: "<p>不错</p>", price: 500,
    address: "会场旁", imageUrl: "", distance: "步行 5 分钟",
  });
  ids.push(h.id);
  expect(h.name).toBe("测试酒店");
  expect(h.price).toBe(500);

  const up = await updateHotel(h.id, {
    name: "测试酒店", description: "<p>很好</p>", price: 666,
    address: "会场旁", imageUrl: "", distance: "步行 5 分钟",
  });
  expect(up.price).toBe(666);

  await deleteHotel(h.id);
  expect(await getHotel(h.id)).toBeNull();
});
