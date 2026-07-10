import { afterAll, beforeAll, expect, test, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { createSpeakerMaterial, listSpeakerMaterials } from "@/lib/speaker-materials";
import { getSpeakerSessions } from "@/lib/speakers";

vi.mock("@/lib/oss", () => ({
  validateSpeakerMaterial: (file: { type: string; size: number }) => {
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.ms-powerpoint",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    if (!allowed.includes(file.type)) {
      return "仅支持 PDF、PPT、PPTX、Word、Excel 文件";
    }
    if (file.size > 50 * 1024 * 1024) return "文件不能超过 50MB";
    return null;
  },
  uploadToOSS: vi.fn(async () => "https://mock-oss.example.com/speakers/test/file.pdf"),
}));

let meetingId: string;
let speakerId: string;
let sessionId: string;
beforeAll(async () => {
  const m = await prisma.meeting.create({ data: { title: "资料测试会议" } });
  meetingId = m.id;
  const s = await prisma.speaker.create({
    data: { meetingId, name: "资料讲者", title: "教授", organization: "测试大学" },
  });
  speakerId = s.id;
  const session = await prisma.session.create({
    data: { meetingId, day: "2026-08-01", startTime: "09:00", endTime: "10:00", room: "A厅", title: "测试日程" },
  });
  sessionId = session.id;
  await prisma.sessionSpeaker.create({
    data: { sessionId, speakerId, role: "SPEAKER" },
  });
});

afterAll(async () => {
  await prisma.speakerMaterial.deleteMany({ where: { speakerId } });
  await prisma.sessionSpeaker.deleteMany({ where: { sessionId } });
  await prisma.session.deleteMany({ where: { meetingId } });
  await prisma.speaker.deleteMany({ where: { id: speakerId } });
  await prisma.meeting.delete({ where: { id: meetingId } }).catch(() => {});
  await prisma.$disconnect();
});

test("创建并列出讲者资料", async () => {
  const sessions = await getSpeakerSessions(speakerId, meetingId);
  expect(sessions.map((x) => x.id)).toContain(sessionId);

  const material = await createSpeakerMaterial({
    speakerId,
    sessionId,
    fileUrl: "https://mock-oss.example.com/speakers/test/file.pdf",
    fileName: "演讲稿.pdf",
    fileSize: 1024,
  });
  // material.id captured for potential future assertions
  expect(material.fileName).toBe("演讲稿.pdf");
  expect(material.speakerId).toBe(speakerId);

  const list = await listSpeakerMaterials(speakerId);
  expect(list).toHaveLength(1);
  expect(list[0].session.title).toBe("测试日程");
});
