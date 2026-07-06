import { prisma } from "@/lib/prisma";

type HotelData = {
  name: string;
  description: string;
  price: number;
  address: string;
  imageUrl: string;
  distance: string;
};

export function createHotel(meetingId: string, data: HotelData) {
  return prisma.hotel.create({ data: { ...data, meetingId } });
}

export function updateHotel(id: string, data: HotelData) {
  return prisma.hotel.update({ where: { id }, data });
}

export function deleteHotel(id: string) {
  return prisma.hotel.delete({ where: { id } });
}
