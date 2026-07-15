"use client";

import {
  AlertCircleIcon,
  BookOpenIcon,
  CalendarIcon,
  CameraIcon,
  CarIcon,
  FileTextIcon,
  HomeIcon,
  HotelIcon,
  InfoIcon,
  LinkIcon,
  MailIcon,
  PhoneIcon,
  StarIcon,
  UsersIcon,
  VideoIcon,
} from "@/components/icons";
import type { HomeGridIconKey } from "@/lib/home-grid-config";

const ICONS = {
  file: FileTextIcon,
  info: InfoIcon,
  book: BookOpenIcon,
  alert: AlertCircleIcon,
  mail: MailIcon,
  calendar: CalendarIcon,
  users: UsersIcon,
  camera: CameraIcon,
  car: CarIcon,
  video: VideoIcon,
  hotel: HotelIcon,
  phone: PhoneIcon,
  home: HomeIcon,
  star: StarIcon,
  link: LinkIcon,
} satisfies Record<HomeGridIconKey, typeof FileTextIcon>;

export default function HomeGridIcon({ icon, className }: { icon: HomeGridIconKey; className?: string }) {
  const Icon = ICONS[icon] ?? FileTextIcon;
  return <Icon className={className} />;
}
