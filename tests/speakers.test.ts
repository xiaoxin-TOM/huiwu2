import { expect, test } from "vitest";
import { filterSpeakers } from "@/lib/speakers";
import type { Speaker } from "@prisma/client";

function spk(partial: Partial<Speaker>): Speaker {
  return {
    id: partial.id ?? "x",
    name: partial.name ?? "",
    title: partial.title ?? "",
    organization: partial.organization ?? "",
    bio: partial.bio ?? "",
    photoUrl: partial.photoUrl ?? null,
    isModerator: partial.isModerator ?? false,
  };
}

const list = [
  spk({ id: "1", name: "张三", organization: "清华大学" }),
  spk({ id: "2", name: "Li Si", organization: "Peking University" }),
  spk({ id: "3", name: "王五", organization: "北京大学" }),
];

test("空查询返回全部", () => {
  expect(filterSpeakers(list, "   ")).toHaveLength(3);
});

test("按姓名匹配", () => {
  expect(filterSpeakers(list, "张三").map((s) => s.id)).toEqual(["1"]);
});

test("按单位匹配且大小写不敏感", () => {
  expect(filterSpeakers(list, "peking").map((s) => s.id)).toEqual(["2"]);
});

test("按单位中文匹配", () => {
  expect(filterSpeakers(list, "北京大学").map((s) => s.id)).toEqual(["3"]);
});
