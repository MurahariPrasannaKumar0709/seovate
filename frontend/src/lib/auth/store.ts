import { prisma } from "@/lib/prisma";

export interface UserRecord {
  email: string;
  createdAt: string;
  lastLoginAt?: string;
  googleSub?: string;
}

export interface OtpRecord {
  email: string;
  purpose: "signup" | "login";
  codeHash: string;
  expiresAt: string;
  attempts: number;
  sentAt: string;
  resendCount: number;
  windowStartedAt: string;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function findUserByEmail(email: string): Promise<UserRecord | undefined> {
  const normalized = normalizeEmail(email);
  const user = await prisma.user.findUnique({ where: { email: normalized } });
  if (!user) return undefined;
  return {
    email: user.email,
    createdAt: user.createdAt.toISOString(),
    lastLoginAt: user.lastLoginAt?.toISOString(),
    googleSub: user.googleSub ?? undefined,
  };
}

export async function upsertUser(
  email: string,
  extra: Partial<Pick<UserRecord, "googleSub">> = {}
): Promise<UserRecord> {
  const normalized = normalizeEmail(email);
  const now = new Date();
  const user = await prisma.user.upsert({
    where: { email: normalized },
    create: { email: normalized, createdAt: now, lastLoginAt: now, googleSub: extra.googleSub },
    update: { lastLoginAt: now, ...(extra.googleSub ? { googleSub: extra.googleSub } : {}) },
  });
  return {
    email: user.email,
    createdAt: user.createdAt.toISOString(),
    lastLoginAt: user.lastLoginAt?.toISOString(),
    googleSub: user.googleSub ?? undefined,
  };
}

export async function setOtp(record: OtpRecord): Promise<void> {
  const normalized = normalizeEmail(record.email);
  await prisma.otpCode.upsert({
    where: { email_purpose: { email: normalized, purpose: record.purpose } },
    create: {
      email: normalized,
      purpose: record.purpose,
      codeHash: record.codeHash,
      expiresAt: new Date(record.expiresAt),
      attempts: record.attempts,
      sentAt: new Date(record.sentAt),
      resendCount: record.resendCount,
      windowStartedAt: new Date(record.windowStartedAt),
    },
    update: {
      codeHash: record.codeHash,
      expiresAt: new Date(record.expiresAt),
      attempts: record.attempts,
      sentAt: new Date(record.sentAt),
      resendCount: record.resendCount,
      windowStartedAt: new Date(record.windowStartedAt),
    },
  });
}

export async function getOtp(
  email: string,
  purpose: OtpRecord["purpose"]
): Promise<OtpRecord | undefined> {
  const normalized = normalizeEmail(email);
  const otp = await prisma.otpCode.findUnique({
    where: { email_purpose: { email: normalized, purpose } },
  });
  if (!otp) return undefined;
  return {
    email: otp.email,
    purpose: otp.purpose as OtpRecord["purpose"],
    codeHash: otp.codeHash,
    expiresAt: otp.expiresAt.toISOString(),
    attempts: otp.attempts,
    sentAt: otp.sentAt.toISOString(),
    resendCount: otp.resendCount,
    windowStartedAt: otp.windowStartedAt.toISOString(),
  };
}

export async function incrementOtpAttempts(
  email: string,
  purpose: OtpRecord["purpose"]
): Promise<OtpRecord | undefined> {
  const normalized = normalizeEmail(email);
  try {
    const otp = await prisma.otpCode.update({
      where: { email_purpose: { email: normalized, purpose } },
      data: { attempts: { increment: 1 } },
    });
    return {
      email: otp.email,
      purpose: otp.purpose as OtpRecord["purpose"],
      codeHash: otp.codeHash,
      expiresAt: otp.expiresAt.toISOString(),
      attempts: otp.attempts,
      sentAt: otp.sentAt.toISOString(),
      resendCount: otp.resendCount,
      windowStartedAt: otp.windowStartedAt.toISOString(),
    };
  } catch {
    return undefined;
  }
}

export async function clearOtp(email: string, purpose: OtpRecord["purpose"]): Promise<void> {
  const normalized = normalizeEmail(email);
  await prisma.otpCode
    .delete({ where: { email_purpose: { email: normalized, purpose } } })
    .catch(() => undefined);
}
