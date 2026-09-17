import crypto from "node:crypto";

export const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
export const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
export const MAX_ATTEMPTS = 5;
export const MAX_RESENDS_PER_WINDOW = 5;
export const RESEND_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const OTP_PEPPER = process.env.OTP_PEPPER ?? "seovate-dev-otp-pepper-do-not-use-in-production";

export function generateOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

export function hashOtp(code: string): string {
  return crypto.createHash("sha256").update(`${code}${OTP_PEPPER}`).digest("hex");
}

export function verifyOtpHash(code: string, hash: string): boolean {
  const candidate = Buffer.from(hashOtp(code));
  const expected = Buffer.from(hash);
  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
}
