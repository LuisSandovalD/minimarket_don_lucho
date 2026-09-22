import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";
export async function sendEmail(to: string, subject: string, htmlContent: string) {
  const config = env();
  if (!config.BREVO_API_KEY || !config.BREVO_SENDER_EMAIL) throw new AppError("EMAIL_NOT_CONFIGURED", "Brevo no está configurado.", 503);
  const response = await fetch("https://api.brevo.com/v3/smtp/email", { method: "POST", headers: { "api-key": config.BREVO_API_KEY, "content-type": "application/json" }, body: JSON.stringify({ sender: { email: config.BREVO_SENDER_EMAIL, name: config.BREVO_SENDER_NAME }, to: [{ email: to }], subject, htmlContent }) });
  if (!response.ok) throw new AppError("EMAIL_SEND_FAILED", "No se pudo enviar el correo.", 502);
}
