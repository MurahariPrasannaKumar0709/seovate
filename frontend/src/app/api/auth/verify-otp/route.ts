import { NextRequest, NextResponse } from "next/server";
import { getOtp, incrementOtpAttempts, clearOtp, upsertUser, normalizeEmail } from "@/lib/auth/store";
import { verifyOtpHash, MAX_ATTEMPTS } from "@/lib/auth/otp";
import { setSessionCookie } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  const { email, code, purpose } = await req.json();

  if (!email || !code || (purpose !== "signup" && purpose !== "login")) {
    return NextResponse.json({ error: "A valid email, code, and purpose are required." }, { status: 400 });
  }

  const normalized = normalizeEmail(email);
  const otp = await getOtp(normalized, purpose);

  if (!otp) {
    return NextResponse.json(
      { error: "No pending code for this email. Please request a new one." },
      { status: 400 }
    );
  }

  if (new Date(otp.expiresAt).getTime() < Date.now()) {
    await clearOtp(normalized, purpose);
    return NextResponse.json({ error: "This code has expired. Please request a new one." }, { status: 400 });
  }

  if (otp.attempts >= MAX_ATTEMPTS) {
    await clearOtp(normalized, purpose);
    return NextResponse.json(
      { error: "Too many incorrect attempts. Please request a new code." },
      { status: 400 }
    );
  }

  if (!verifyOtpHash(code, otp.codeHash)) {
    const updated = await incrementOtpAttempts(normalized, purpose);
    if (updated && updated.attempts >= MAX_ATTEMPTS) {
      await clearOtp(normalized, purpose);
      return NextResponse.json(
        { error: "Too many incorrect attempts. Please request a new code." },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Incorrect code. Please try again." }, { status: 401 });
  }

  await clearOtp(normalized, purpose);
  const user = await upsertUser(normalized);

  const response = NextResponse.json({ email: user.email });
  setSessionCookie(response, user.email);
  return response;
}
