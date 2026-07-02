import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Providers from "@/components/Providers";
import "./globals.css";

const geistSans = localFont({
  src: [
    { path: "../../public/fonts/geist-latin.woff2", weight: "100 900" },
    { path: "../../public/fonts/geist-latin-ext.woff2", weight: "100 900" },
  ],
  variable: "--font-geist-sans",
});

const geistMono = localFont({
  src: [
    { path: "../../public/fonts/geist-mono-latin.woff2", weight: "100 900" },
    { path: "../../public/fonts/geist-mono-latin-ext.woff2", weight: "100 900" },
  ],
  variable: "--font-geist-mono",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "会务管理系统",
  description: "学术会议会务管理系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col"><Providers>{children}</Providers></body>
    </html>
  );
}
