import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, PDFImage, PDFFont, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { prisma } from "@/lib/prisma";
import type { BadgeTemplateInput } from "@/lib/validation";
import type { Meeting, Registration, BadgeTemplate } from "@prisma/client";

const MM_TO_PT = 2.83465;
const PX_TO_PT = 1;

export function mmToPt(mm: number): number {
  return mm * MM_TO_PT;
}

export function pxToPt(px: number): number {
  return px * PX_TO_PT;
}

const DEFAULT_TEMPLATE: Omit<
  BadgeTemplate,
  "id" | "meetingId" | "updatedAt"
> = {
  pageWidthMm: 86,
  pageHeightMm: 147,
  bgImageUrl: null,
  nameX: 43,
  nameY: 52,
  nameSize: 10,
  titleX: 43,
  titleY: 40,
  titleSize: 10,
  companyX: 43,
  companyY: 28,
  companySize: 10,
  qrX: 43,
  qrY: 92,
  qrSize: 34,
  meetingTitleX: 43,
  meetingTitleY: 128,
  meetingTitleSize: 10,
};

export async function getBadgeTemplate(meetingId: string): Promise<BadgeTemplate> {
  const existing = await prisma.badgeTemplate.findUnique({ where: { meetingId } });
  if (existing) return existing;
  return prisma.badgeTemplate.create({
    data: { ...DEFAULT_TEMPLATE, meetingId },
  });
}

export function upsertBadgeTemplate(meetingId: string, data: BadgeTemplateInput) {
  return prisma.badgeTemplate.upsert({
    where: { meetingId },
    create: { ...data, meetingId },
    update: data,
  });
}

async function loadImageBytes(url: string): Promise<Uint8Array | null> {
  try {
    if (url.startsWith("/")) {
      const filePath = path.join(process.cwd(), "public", url);
      return await readFile(filePath);
    }
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    return new Uint8Array(buf);
  } catch {
    return null;
  }
}

async function embedBackground(
  pdfDoc: PDFDocument,
  bgImageUrl: string | null,
): Promise<PDFImage | null> {
  if (!bgImageUrl) return null;
  const bytes = await loadImageBytes(bgImageUrl);
  if (!bytes) return null;
  try {
    if (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47
    ) {
      return await pdfDoc.embedPng(bytes);
    }
    return await pdfDoc.embedJpg(bytes);
  } catch {
    return null;
  }
}

async function loadChineseFont(): Promise<Uint8Array> {
  const fontPath = path.join(process.cwd(), "public", "fonts", "simhei.ttf");
  return readFile(fontPath);
}

async function drawBadgePage(
  pdfDoc: PDFDocument,
  font: PDFFont,
  registration: Pick<Registration, "fullName" | "organization" | "title" | "token">,
  meeting: Pick<Meeting, "title">,
  template: BadgeTemplate,
) {
  const width = mmToPt(template.pageWidthMm);
  const height = mmToPt(template.pageHeightMm);
  const page = pdfDoc.addPage([width, height]);

  const bg = await embedBackground(pdfDoc, template.bgImageUrl);
  if (bg) {
    page.drawImage(bg, { x: 0, y: 0, width, height });
  }

  function drawCenteredText(
    text: string,
    xMm: number,
    yMm: number,
    sizePx: number,
    options: { color?: ReturnType<typeof rgb> } = {},
  ) {
    if (!text) return;
    const size = pxToPt(sizePx);
    const x = mmToPt(xMm);
    const y = mmToPt(yMm);
    const textWidth = font.widthOfTextAtSize(text, size);
    page.drawText(text, {
      x: x - textWidth / 2,
      y,
      size,
      font,
      color: options.color ?? rgb(0, 0, 0),
    });
  }

  if (template.bgImageUrl) {
    drawCenteredText(
      meeting.title,
      template.meetingTitleX,
      template.meetingTitleY,
      template.meetingTitleSize,
    );
    drawCenteredText(
      registration.fullName,
      template.nameX,
      template.nameY,
      template.nameSize,
    );
    drawCenteredText(
      registration.title,
      template.titleX,
      template.titleY,
      template.titleSize,
    );
    drawCenteredText(
      registration.organization,
      template.companyX,
      template.companyY,
      template.companySize,
    );
  } else {
    function drawLabeledText(
      label: string,
      value: string,
      valueX: number,
      yMm: number,
      sizePx: number,
    ) {
      if (!value) return;
      const size = pxToPt(sizePx);
      const y = mmToPt(yMm);
      const valueXPos = mmToPt(valueX);
      const labelRightX = mmToPt(valueX - 5);
      const labelWidth = font.widthOfTextAtSize(label, size);
      const labelX = Math.max(mmToPt(5), labelRightX - labelWidth);
      page.drawText(label, {
        x: labelX,
        y,
        size,
        font,
        color: rgb(0, 0, 0),
      });
      page.drawText(value, {
        x: valueXPos,
        y,
        size,
        font,
        color: rgb(0, 0, 0),
      });
    }

    drawCenteredText(
      meeting.title,
      template.meetingTitleX,
      template.meetingTitleY,
      template.meetingTitleSize,
    );
    drawLabeledText(
      "姓名：",
      registration.fullName,
      template.nameX,
      template.nameY,
      template.nameSize,
    );
    drawLabeledText(
      "职位：",
      registration.title,
      template.titleX,
      template.titleY,
      template.titleSize,
    );
    drawLabeledText(
      "单位：",
      registration.organization,
      template.companyX,
      template.companyY,
      template.companySize,
    );
  }

  // Photo placeholder (square border)
  function drawPhotoPlaceholder(
    centerX: number,
    centerY: number,
    sizeMm: number,
  ) {
    const size = mmToPt(sizeMm);
    const x = mmToPt(centerX) - size / 2;
    const y = mmToPt(centerY) - size / 2;
    page.drawRectangle({
      x,
      y,
      width: size,
      height: size,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });
    const text = "贴照片处";
    const textSize = size / 5;
    const textWidth = font.widthOfTextAtSize(text, textSize);
    page.drawText(text, {
      x: mmToPt(centerX) - textWidth / 2,
      y: mmToPt(centerY) - textSize / 2,
      size: textSize,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  drawPhotoPlaceholder(template.qrX, template.qrY, template.qrSize);
}

export async function renderBadgePdf(
  registration: Pick<Registration, "fullName" | "organization" | "title" | "token">,
  meeting: Pick<Meeting, "title">,
  template: BadgeTemplate,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  const fontBytes = await loadChineseFont();
  const font = await pdfDoc.embedFont(fontBytes);
  await drawBadgePage(pdfDoc, font, registration, meeting, template);
  return pdfDoc.save();
}

export async function renderBadgesPdf(
  registrations: Pick<Registration, "fullName" | "organization" | "title" | "token">[],
  meeting: Pick<Meeting, "title">,
  template: BadgeTemplate,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  const fontBytes = await loadChineseFont();
  const font = await pdfDoc.embedFont(fontBytes);
  for (const registration of registrations) {
    await drawBadgePage(pdfDoc, font, registration, meeting, template);
  }
  return pdfDoc.save();
}
