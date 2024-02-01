import { env } from "process";

const isReleace = !env.npm_lifecycle_script?.indexOf("development");

const isCompress = true;

const version = "1.2.2";
console.log("mode " + (isReleace ? "Release v-" + version : "development"));

const mail = {
  // PROVIDER: isReleace ? "smtp" : "",
  PROVIDER: "smtp",
  HOST: "smtp.mail.ru",
  PORT: 465,
  USER: "boss.kir03@mail.ru",
  PASS: "19Zehrd0uhdSJP9S8kdz",
};

const db = !isReleace
  ? {
      HOST: "127.0.0.1",
      PORT: 27017,
      USER: "user",
      PASS: "8520",
      NAME: "admin",
    }
  : {
      HOST: "localhost",
      PORT: 17035,
      USER: "wuserch",
      PASS: "V8^78VerYV6w",
      NAME: "admin",
    };

const host = !isReleace
  ? {
      DOMAIN: "127.0.0.1",
      PROTO: "https",
      HOST: "127.0.0.1",
      PORT: 9001,
      CRT: "./misc/certificate.crt",
      KEY: "./misc/certificate.key",
    }
  : // : {
    //     DOMAIN: "chesswood.online",
    //     PROTO: "https",
    //     HOST: "193.168.48.164",
    //     PORT: 443,
    //     CRT: "/etc/letsencrypt/live/chesswood.online-0001/fullchain.pem",
    //     KEY: "/etc/letsencrypt/live/chesswood.online-0001/privkey.pem",
    //   };
    {
      DOMAIN: "chesswood.online",
      PROTO: "http",
      HOST: "127.0.0.1",
      PORT: 8080,
      // CRT: "/etc/letsencrypt/live/chesswood.online-0001/fullchain.pem",
      // KEY: "/etc/letsencrypt/live/chesswood.online-0001/privkey.pem",
    };

const security = !isReleace
  ? {
      TOKEN_PASS: "Yhg^&8-f5v-;vm9-",
      ADMIN_PASS: "hello",
    }
  : {
      TOKEN_PASS: "TGhj^8buver8v43^&^&F",
      ADMIN_PASS: "G*^NT8n8byui",
    };

const captcha = {
  SECRET_KEY: "d7WqRnt7QRbWzaX1EEQmEgnSMmy8rNDwCjT4COJA",
};

const limits = {
  AVATAR_SIZE: 1024 ** 3,
};

const resourcePath = !isReleace ? "./resources" : "/home/user/resources";
const avatarsPath = !isReleace
  ? "./resources/shared/avatars/"
  : "/home/user/resources/shared/avatars/";
const staticPath = !isReleace ? "./wwwroot" : "/home/user/wwwroot";

export {
  mail,
  db,
  host,
  security,
  limits,
  isReleace,
  isCompress,
  version,
  captcha,
  resourcePath,
  avatarsPath,
  staticPath,
};
