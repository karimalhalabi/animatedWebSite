import test from "node:test";
import assert from "node:assert/strict";
import {
  hashPassword,
  verifyPassword,
  validateMember,
  publicMember,
} from "../utils/security.js";
test("passwords are salted, verified, and never exposed in public profiles", async () => {
  const first = await hashPassword("correct-password"),
    second = await hashPassword("correct-password");
  assert.notEqual(first, second);
  assert.equal(await verifyPassword("correct-password", first), true);
  assert.equal(await verifyPassword("wrong-password", first), false);
  assert.equal(await verifyPassword(null, first), false);
  assert.equal(
    "passwordHash" in publicMember({ id: 1, name: "عضو", passwordHash: first }),
    false,
  );
});
test("member validation rejects invalid roles, emails and weak passwords", () => {
  const data = {
    name: "عضو جديد",
    email: "member@example.com",
    password: "secure-password",
    title: "مصمم",
    team: "التصميم",
    role: 100,
  };
  assert.equal(validateMember(data).role, 100);
  for (const change of [
    { role: 300 },
    { email: "invalid" },
    { password: "short" },
    { name: "" },
  ])
    assert.throws(() => validateMember({ ...data, ...change }));
});
