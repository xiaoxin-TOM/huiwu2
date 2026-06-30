import { afterAll, beforeAll, expect, test } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  createBooking,
  listUserBookings,
  reviewBooking,
} from "@/lib/bookings";

let userId: string;
let hotelId: string;

beforeAll(async () => {
  const u = await prisma.user.create({
    data: { name: "预订测试", email: "booktest@example.com", passwordHash: "x" },
  });
  userId = u.id;
  const h = await prisma.hotel.create({ data: { name: "测试酒店", price: 500 } });
  hotelId = h.id;
});

afterAll(async () => {
  await prisma.hotelBooking.deleteMany({ where: { userId } });
  await prisma.hotel.delete({ where: { id: hotelId } }).catch(() => {});
  await prisma.user.delete({ where: { id: userId } }).catch(() => {});
  await prisma.$disconnect();
});

test("创建预订→列出用户预订→审核回显", async () => {
  const b = await createBooking(userId, {
    hotelId, checkIn: "2026-09-18", checkOut: "2026-09-20", rooms: 2,
  });
  expect(b.status).toBe("PENDING");
  expect(b.rooms).toBe(2);

  const list = await listUserBookings(userId);
  expect(list).toHaveLength(1);
  expect(list[0].hotel.name).toBe("测试酒店");

  const reviewed = await reviewBooking(b.id, "APPROVED");
  expect(reviewed.status).toBe("APPROVED");
});

test("酒店不存在抛 HOTEL_NOT_FOUND", async () => {
  await expect(
    createBooking(userId, {
      hotelId: "no-such-hotel", checkIn: "2026-09-18", checkOut: "2026-09-20", rooms: 1,
    }),
  ).rejects.toThrow("HOTEL_NOT_FOUND");
});
