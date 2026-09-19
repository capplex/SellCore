import "server-only";
import { serverEnv } from "@/lib/env";

export type EmailMessage = { to: string; subject: string; html: string; text?: string };
interface EmailProvider { send(message: EmailMessage): Promise<void> }

class ConsoleEmailProvider implements EmailProvider {
  async send(message: EmailMessage) { console.info("[SellCore email]", { to: message.to, subject: message.subject }); }
}
class ResendProvider implements EmailProvider {
  constructor(private apiKey: string, private from: string) {}
  async send(message: EmailMessage) {
    const res = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: this.from, ...message }) });
    if (!res.ok) throw new Error(`EMAIL_PROVIDER_ERROR:${res.status}`);
  }
}

export function getEmailProvider(): EmailProvider {
  const env = serverEnv();
  if (env.EMAIL_PROVIDER === "resend") {
    if (!env.EMAIL_API_KEY) throw new Error("EMAIL_API_KEY is required for Resend.");
    return new ResendProvider(env.EMAIL_API_KEY, env.EMAIL_FROM);
  }
  return new ConsoleEmailProvider();
}
