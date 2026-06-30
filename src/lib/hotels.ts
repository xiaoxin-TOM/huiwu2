import { prisma } from "@/lib/prisma";

export function listHotels() {
  return prisma.hotel.findMany({ orderBy: { price: "asc" } });
}

export function getHotel(id: string) {
  return prisma.hotel.findUnique({ where: { id } });
}
