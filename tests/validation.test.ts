import { expect, test } from "vitest";
import { registrationSchema, submissionSchema, reviewSchema } from "@/lib/validation";

test("registrationSchema 必填校验与默认值", () => {
  expect(registrationSchema.safeParse({ typeId: "", fullName: "" }).success).toBe(false);
  const ok = registrationSchema.safeParse({ typeId: "t1", fullName: "张三" });
  expect(ok.success).toBe(true);
  if (ok.success) expect(ok.data.organization).toBe("");
});

test("submissionSchema 必填校验", () => {
  expect(submissionSchema.safeParse({ title: "", authors: "a", abstract: "b" }).success).toBe(false);
  expect(submissionSchema.safeParse({ title: "t", authors: "a", abstract: "b" }).success).toBe(true);
});

test("reviewSchema 仅接受 APPROVED/REJECTED", () => {
  expect(reviewSchema.safeParse({ decision: "APPROVED" }).success).toBe(true);
  expect(reviewSchema.safeParse({ decision: "MAYBE" }).success).toBe(false);
});
