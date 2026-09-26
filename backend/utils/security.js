import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
const scrypt = promisify(scryptCallback);
export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${(await scrypt(password, salt, 64)).toString("hex")}`;
}
export async function verifyPassword(password, stored) {
  if (typeof password !== "string" || password.length > 128 || !stored)
    return false;
  const [salt, hash] = stored.split(":");
  const expected = Buffer.from(hash, "hex");
  const actual = await scrypt(password, salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
export const publicMember = (m) => ({
  id: m.id,
  name: m.name,
  email: m.email,
  title: m.title,
  team: m.team,
  role: m.role,
  avatar: m.avatar,
});
export function validateMember(input) {
  const { name, email, password, title, team, role } = input || {};
  if (
    ![name, email, title, team].every(
      (v) => typeof v === "string" && v.trim().length > 0 && v.length <= 120,
    )
  )
    throw new Error("يرجى إكمال جميع الحقول بشكل صحيح");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new Error("البريد الإلكتروني غير صالح");
  if (
    typeof password !== "string" ||
    password.length < 8 ||
    password.length > 128
  )
    throw new Error("كلمة المرور يجب أن تكون بين 8 و128 حرفاً");
  if (![100, 200].includes(Number(role))) throw new Error("الدور غير صالح");
  return {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    title: title.trim(),
    team: team.trim(),
    role: Number(role),
  };
}
