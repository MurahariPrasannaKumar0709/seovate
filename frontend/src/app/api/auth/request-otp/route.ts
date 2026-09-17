import { NextRequest, NextResponse } from "next/server";
import {
  findUserByEmail,
  getOtp,
  setOtp,
  normalizeEmail,
  type OtpRecord,
} from "@/lib/auth/store";
import {
  generateOtp,
  hashOtp,
  OTP_TTL_MS,
  RESEND_COOLDOWN_MS,
  RESEND_WINDOW_MS,
  MAX_RESENDS_PER_WINDOW,
} from "@/lib/auth/otp";
import { sendMail } from "@/lib/auth/mailer";

export async function POST(req: NextRequest) {
  const { email, purpose } = await req.json();

  if (!email || (purpose !== "signup" && purpose !== "login")) {
    return NextResponse.json({ error: "A valid email and purpose are required." }, { status: 400 });
  }

  const normalized = normalizeEmail(email);
  const existingUser = await findUserByEmail(normalized);

  if (purpose === "signup" && existingUser) {
    return NextResponse.json(
      { error: "An account with this email already exists. Try logging in instead." },
      { status: 409 }
    );
  }

  if (purpose === "login" && !existingUser) {
    return NextResponse.json(
      { error: "No account found for this email. Sign up first." },
      { status: 404 }
    );
  }

  const now = Date.now();
  const existingOtp = await getOtp(normalized, purpose);

  if (existingOtp) {
    const sinceLastSend = now - new Date(existingOtp.sentAt).getTime();
    if (sinceLastSend < RESEND_COOLDOWN_MS) {
      const waitSeconds = Math.ceil((RESEND_COOLDOWN_MS - sinceLastSend) / 1000);
      return NextResponse.json(
        { error: `Please wait ${waitSeconds}s before requesting another code.` },
        { status: 429 }
      );
    }

    const windowAge = now - new Date(existingOtp.windowStartedAt).getTime();
    if (windowAge < RESEND_WINDOW_MS && existingOtp.resendCount >= MAX_RESENDS_PER_WINDOW) {
      return NextResponse.json(
        { error: "Too many code requests. Please try again in a few minutes." },
        { status: 429 }
      );
    }
  }

  const code = generateOtp();
  const nowIso = new Date(now).toISOString();
  const record: OtpRecord = {
    email: normalized,
    purpose,
    codeHash: hashOtp(code),
    expiresAt: new Date(now + OTP_TTL_MS).toISOString(),
    attempts: 0,
    sentAt: nowIso,
    resendCount:
      existingOtp && now - new Date(existingOtp.windowStartedAt).getTime() < RESEND_WINDOW_MS
        ? existingOtp.resendCount + 1
        : 1,
    windowStartedAt:
      existingOtp && now - new Date(existingOtp.windowStartedAt).getTime() < RESEND_WINDOW_MS
        ? existingOtp.windowStartedAt
        : nowIso,
  };
  await setOtp(record);

  let previewUrl: string | false = false;
  try {
    const result = await sendMail({
      to: normalized,
      subject: `Your Seovate ${purpose === "signup" ? "sign-up" : "login"} code`,
      text: `Your Seovate verification code is ${code}. It expires in 10 minutes.`,
      html: `<p>Your Seovate verification code is:</p><p style="font-size:28px;font-weight:bold;letter-spacing:4px;">${code}</p><p>This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>`,
    });
    previewUrl = result.previewUrl;
  } catch (err) {
    console.error("Failed to send OTP email:", err);
    return NextResponse.json({ error: "Couldn't send the verification email. Please try again." }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    previewUrl,
    ...(process.env.NODE_ENV !== "production" ? { devCode: code } : {}),
  });
}
