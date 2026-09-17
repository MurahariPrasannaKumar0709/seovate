import nodemailer, { Transporter } from "nodemailer";

let cachedTransporter: Promise<Transporter> | null = null;
let usingEthereal = false;

/**
 * Real SMTP creds (SMTP_HOST etc.) go straight to nodemailer. With none set,
 * falls back to an auto-provisioned Ethereal inbox so signup/login/forgot-password
 * can be exercised end-to-end without a real mail account.
 */
function buildTransporter(): Promise<Transporter> {
  if (cachedTransporter) return cachedTransporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    cachedTransporter = Promise.resolve(
      nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT ?? 587),
        secure: Number(SMTP_PORT ?? 587) === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      })
    );
    return cachedTransporter;
  }

  usingEthereal = true;
  cachedTransporter = nodemailer.createTestAccount().then((testAccount) =>
    nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: { user: testAccount.user, pass: testAccount.pass },
    })
  );
  return cachedTransporter;
}

export interface SendMailResult {
  messageId: string;
  previewUrl: string | false;
}

export async function sendMail(options: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<SendMailResult> {
  const transporter = await buildTransporter();
  const from = process.env.SMTP_FROM ?? "Seovate <reports@seovate.com>";

  const info = await transporter.sendMail({
    from,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });

  return {
    messageId: info.messageId,
    previewUrl: usingEthereal ? nodemailer.getTestMessageUrl(info) : false,
  };
}
