import { get } from "https";
import { captcha } from "../configs";
import sendToSentry from "./sendToSentry";

function verifyCaptcha(token: string, clientIP: string): Promise<boolean> {
  return new Promise((resolve) => {
    get(
      `https://captcha-api.yandex.ru/validate?secret=${captcha.SECRET_KEY}&token=${token}&ip=${clientIP}`,
      (res) => {
        res.on("data", (content) => {
          if (res.statusCode !== 200) {
            sendToSentry(
              new Error(
                `verifyCaptcha: Allow access due to an error: code=${res.statusCode}; message=${content}`
              )
            );

            return resolve(true);
          }
          resolve(JSON.parse(content).status === "ok");
        });
      }
    )
      .on("error", (error) => {
        sendToSentry(error);
        resolve(true);
      })
      .end();
  });
}

export default verifyCaptcha;
