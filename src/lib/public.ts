import type { Meeting, SiteConfig } from "@prisma/client";

export function meetingHref(meetingId: string | undefined, href: string): string {
  if (!meetingId) return href;
  if (href === "/register-conf") return `/r/${meetingId}`;
  return `/m/${meetingId}${href}`;
}

export interface PublicConfig {
  confName: string;
  confDate: string;
  confLocation: string;
  logoUrl: string | null;
  liveUrl: string | null;
  welcomeHtml: string;
  footerHtml: string;
  contactHtml: string;
}

export function getPublicConfig(meeting: Meeting, siteConfig?: SiteConfig | null): PublicConfig {
  return {
    confName: meeting.title || siteConfig?.confName || "",
    confDate: meeting.confDate || siteConfig?.confDate || "",
    confLocation: meeting.location || siteConfig?.confLocation || "",
    logoUrl: meeting.logoUrl ?? siteConfig?.logoUrl ?? null,
    liveUrl: meeting.liveUrl ?? siteConfig?.liveUrl ?? null,
    welcomeHtml: meeting.welcomeHtml || siteConfig?.welcomeHtml || "",
    footerHtml: meeting.footerHtml || siteConfig?.footerHtml || "",
    contactHtml: meeting.contactHtml || siteConfig?.contactHtml || "",
  };
}
