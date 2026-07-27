import { expect, test } from "vitest";
import { canViewMaterial, type MaterialFacts, type MaterialViewer } from "@/lib/material-access";

const M = "meeting-1";
const OTHER = "meeting-2";
const SPEAKER_USER = "user-speaker";

function facts(over: Partial<MaterialFacts> = {}): MaterialFacts {
  return {
    meetingId: M,
    status: "APPROVED",
    isConfidential: false,
    speakerUserId: SPEAKER_USER,
    ...over,
  };
}

const admin: MaterialViewer = { kind: "admin", meetingId: M };
const adminElsewhere: MaterialViewer = { kind: "admin", meetingId: OTHER };
const owner: MaterialViewer = { kind: "user", userId: SPEAKER_USER, attendeeOfMeetingId: null };
const attendee: MaterialViewer = { kind: "user", userId: "user-attendee", attendeeOfMeetingId: M };
const strangerUser: MaterialViewer = { kind: "user", userId: "user-x", attendeeOfMeetingId: null };
const reportLink: MaterialViewer = { kind: "reportLink", meetingId: M };
const reportLinkElsewhere: MaterialViewer = { kind: "reportLink", meetingId: OTHER };
const visitor: MaterialViewer = { kind: "visitor", openMeetingId: M };
const closedVisitor: MaterialViewer = { kind: "visitor", openMeetingId: null };

test("管理员可看本会议任意状态、含保密的材料", () => {
  for (const status of ["PENDING", "APPROVED", "REJECTED"] as const) {
    expect(canViewMaterial(facts({ status }), admin)).toBe(true);
    expect(canViewMaterial(facts({ status, isConfidential: true }), admin)).toBe(true);
  }
});

test("管理员看不到其他会议的材料", () => {
  expect(canViewMaterial(facts(), adminElsewhere)).toBe(false);
});

test("上传讲者本人可看自己的材料，包括待审与被驳回的", () => {
  for (const status of ["PENDING", "APPROVED", "REJECTED"] as const) {
    expect(canViewMaterial(facts({ status, isConfidential: true }), owner)).toBe(true);
  }
});

test("参会用户只能看审核通过的公开材料", () => {
  expect(canViewMaterial(facts(), attendee)).toBe(true);
  expect(canViewMaterial(facts({ isConfidential: true }), attendee)).toBe(false);
  expect(canViewMaterial(facts({ status: "PENDING" }), attendee)).toBe(false);
  expect(canViewMaterial(facts({ status: "REJECTED" }), attendee)).toBe(false);
});

test("未报名的登录用户看不到材料", () => {
  expect(canViewMaterial(facts(), strangerUser)).toBe(false);
});

test("报名的是别的会议时看不到本会议材料", () => {
  expect(
    canViewMaterial(facts(), { kind: "user", userId: "u", attendeeOfMeetingId: OTHER }),
  ).toBe(false);
});

test("汇报链接可看审核通过的全部材料，含保密", () => {
  expect(canViewMaterial(facts(), reportLink)).toBe(true);
  expect(canViewMaterial(facts({ isConfidential: true }), reportLink)).toBe(true);
});

test("汇报链接看不到未通过审核的材料", () => {
  expect(canViewMaterial(facts({ status: "PENDING" }), reportLink)).toBe(false);
  expect(canViewMaterial(facts({ status: "REJECTED" }), reportLink)).toBe(false);
});

test("汇报链接不能跨会议", () => {
  expect(canViewMaterial(facts(), reportLinkElsewhere)).toBe(false);
  expect(canViewMaterial(facts({ isConfidential: true }), reportLinkElsewhere)).toBe(false);
});

test("会议关闭实名时游客可看公开且已通过的材料", () => {
  expect(canViewMaterial(facts(), visitor)).toBe(true);
  expect(canViewMaterial(facts({ isConfidential: true }), visitor)).toBe(false);
  expect(canViewMaterial(facts({ status: "PENDING" }), visitor)).toBe(false);
});

test("会议要求实名时游客什么都看不到", () => {
  expect(canViewMaterial(facts(), closedVisitor)).toBe(false);
});

test("讲者未绑定用户时不会因 null 相等而误放行", () => {
  const unbound = facts({ speakerUserId: null, status: "PENDING" });
  expect(canViewMaterial(unbound, { kind: "user", userId: "u", attendeeOfMeetingId: M })).toBe(false);
  expect(canViewMaterial(unbound, strangerUser)).toBe(false);
});
