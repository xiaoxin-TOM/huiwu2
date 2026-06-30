import { prisma } from "@/lib/prisma";

type HotelData = {
  name: string;
  description: string;
  price: number;
  address: string;
  imageUrl: string;
  distance: string;
};

export function createHotel(data: HotelData) {
  return prisma.hotel.create({ data });
}

export function updateHotel(id: string, data: HotelData) {
  return prisma.hotel.update({ where: { id }, data });
}

export function deleteHotel(id: string) {
  return prisma.hotel.delete({ where: { id } });
}
