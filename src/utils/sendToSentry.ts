import ErrorTemplate from "../email/template/ErrorTemplate";
import getMailManager from "../email/getMailManager";

export interface SentryOptions {
  userId?: string;
  ip?: string;
  tags?: {
    [tag: string]: string;
  };
}

// Even though this is a promise we'll never need to await it, so we'll never need to worry about catching an error
const sendToSentry = async (error: Error, { userId, ip, tags }: SentryOptions = {}) => {
  console.error("SEND TO SENTRY", error, JSON.stringify(tags), ip, userId);

  const stringTags = Object.entries(tags || {}).map((v) => `${v[0]} : ${v[1]}`);
  getMailManager().sendEmail({
    to: "kirill03.crav@yandex.ru",
    tags: stringTags,
    subject: "Sentry Message",
    html: ErrorTemplate(error, stringTags),
  });
};

export default sendToSentry;
