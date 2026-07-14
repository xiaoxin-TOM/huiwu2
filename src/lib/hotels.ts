import { prisma } from "@/lib/prisma";

export function listHotels(meetingId: string) {
  return prisma.hotel.findMany({ where: { meetingId }, orderBy: { price: "asc" } });
}

export function getHotel(id: string) {
  return prisma.hotel.findUnique({ where: { id } });
}
