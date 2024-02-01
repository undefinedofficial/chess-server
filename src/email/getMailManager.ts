import { mail } from "../configs";
import MailManager from "./MailManager";
import MailManagerDebug from "./MailManagerDebug";
import MailManagerSMTP from "./MailManagerSMTP";

let mailManager: MailManager;

const managers = {
  smtp: MailManagerSMTP,
  debug: MailManagerDebug,
} as const;

const getMailManager = () => {
  if (!mailManager) {
    const mailProvider = mail.PROVIDER!;
    const Manager = managers[mailProvider as keyof typeof managers] ?? MailManagerDebug;
    mailManager = new Manager();
  }
  return mailManager;
};

export default getMailManager;
