import nodemailer from "nodemailer";
import sendToSentry from "../utils/sendToSentry";
import MailManager, { MailManagerOptions } from "./MailManager";
import { mail } from "../configs";

export default class MailManagerSMTP extends MailManager {
  transport = nodemailer.createTransport({
    host: mail.HOST,
    port: mail.PORT,
    auth: {
      user: mail.USER,
      pass: mail.PASS,
    },
    secure: true,
    requireTLS: true,
    pool: true,
    maxConnections: 10,
    rateLimit: 50,
  });

  async sendEmail(options: MailManagerOptions) {
    const { subject, body, to, attachments, html } = options;
    try {
      await this.transport.sendMail({
        from: mail.USER,
        to,
        subject,
        text: body,
        html,
        attachments,
      });
    } catch (e) {
      const error = e instanceof Error ? e : new Error("SMTP nodemailer error");
      sendToSentry(error, {
        tags: { to: JSON.stringify(to) },
      });
      return false;
    }
    return true;
  }
}
