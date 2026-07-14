import { prisma } from "@/lib/prisma";
import type { BookingInput } from "@/lib/validation";

export async function createBooking(userId: string, meetingId: string, input: BookingInput) {
  const hotel = await prisma.hotel.findUnique({ where: { id: input.hotelId } });
  if (!hotel) throw new Error("HOTEL_NOT_FOUND");
  return prisma.hotelBooking.create({
    data: {
      userId,
      meetingId,
      hotelId: input.hotelId,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      rooms: input.rooms,
    },
  });
}

export function listUserBookings(userId: string, meetingId: string) {
  return prisma.hotelBooking.findMany({
    where: { userId, meetingId },
    include: { hotel: true },
    orderBy: { createdAt: "desc" },
  });
}

export function listBookings(meetingId: string) {
  return prisma.hotelBooking.findMany({
    where: { meetingId },
    include: { user: true, hotel: true },
    orderBy: { createdAt: "desc" },
  });
}

export function reviewBooking(id: string, decision: "APPROVED" | "REJECTED") {
  return prisma.hotelBooking.update({ where: { id }, data: { status: decision } });
}
