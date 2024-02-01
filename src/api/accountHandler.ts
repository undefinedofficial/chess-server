import parseBody from "../utils/parseBody";
import { Handlers } from "../wanderHandlers";
import validate, {
  locationSchema,
  captchaSchema,
  emailSchema,
  passwordSchema,
  nickSchema,
} from "../validates";
import sendHttpRes from "../sendHttpRes";
import dbContext from "../database/dbContext";
import encodeAuthToken from "../utils/encodeAuthToken";
import generateHash from "../utils/generateHash";
import verifyCaptcha from "../utils/verifyCaptcha";
import getIP from "../utils/getIP";
import { isReleace, version } from "../configs";
import sendToSentry from "../utils/sendToSentry";
import getMailManager from "../email/getMailManager";
import randomString from "../utils/randomString";
import ConfirmTemplate from "../email/template/ConfirmTemplate";
import { userToJSONsm } from "../utils/userToJSON";

const checkNickValid = validate<string>(nickSchema);
const checkEmailValid = validate<string>(emailSchema);

const signinValid = validate<{
  email: string;
  password: string;
  captcha: string;
}>({
  type: "object",
  properties: {
    email: emailSchema as any,
    password: passwordSchema as any,
    captcha: captchaSchema as any,
  },
  required: ["email", "password", "captcha"],
  errorMessage: {
    required: "invalid model",
  },
});

const signupValid = validate<{
  nickname: string;
  email: string;
  password: string;
  location: string;
  captcha: string;
}>({
  type: "object",
  properties: {
    nickname: nickSchema as any,
    email: emailSchema as any,
    password: passwordSchema as any,
    location: locationSchema as any,
    captcha: captchaSchema as any,
  },
  required: ["email", "password", "location", "captcha"],
  errorMessage: "invalid model",
});

const ForgotPasswordValid = validate<{
  email: string;
  captcha: string;
}>({
  type: "object",
  properties: {
    email: emailSchema as any,
    captcha: captchaSchema as any,
  },
  required: ["email", "captcha"],
  errorMessage: {
    required: "invalid model",
  },
});

const reserPasswordValid = validate<{
  password: string;
  confirm: string;
}>({
  type: "object",
  properties: {
    password: passwordSchema as any,
    confirm: { type: "string" },
  },
  required: ["password", "confirm"],
  errorMessage: {
    required: "invalid model",
  },
});

const questionValid = validate<{
  email: string;
  topic: string;
  body: string;
}>({
  type: "object",
  properties: {
    email: emailSchema as any,
    topic: { type: "string", maxLength: 128 },
    body: { type: "string", maxLength: 1024 },
  },
  required: ["email", "topic"],
  errorMessage: {
    required: "invalid model",
  },
});

const accountHandlers: Handlers = {
  get: {
    nick: async (res, req) => {
      const nick = req.getQuery("nick");
      if (!checkNickValid(nick))
        return sendHttpRes(res, 400, signinValid.errors?.map((e) => e.message).join("\n"));

      const noBusy = !(await dbContext.Users.findByNickname(nick));
      if (noBusy) return sendHttpRes(res, 200);

      sendHttpRes(res, 409);
    },

    search: async (res, req) => {
      const query = req.getQuery("q");
      let skip = parseInt(req.getQuery("o"));
      let limit = parseInt(req.getQuery("c"));

      if (!skip) skip = 0;
      if (!limit) limit = 5;

      const founds = await dbContext.Users.find({
        nickname: { $regex: query, $options: "i" },
      })
        .skip(skip)
        .limit(limit)
        .lean();
      sendHttpRes(res, 200, userToJSONsm(founds));
    },
  },
  post: {
    signin: async (res, req) => {
      const clientIP = getIP(res, req);

      const obj = await parseBody({ res });
      if (!signinValid(obj))
        return sendHttpRes(res, 400, signinValid.errors?.map((e) => e.message).join("\n"));

      obj.email = obj.email.toLowerCase();

      /* find to database user */
      const user = await dbContext.Users.findByEmail(obj.email).populate("role");
      if (!user) return sendHttpRes(res, 400, "error");

      /* Password equal hashing */
      if (user.password !== generateHash(obj.password) || !user.confirmed)
        return sendHttpRes(res, 400, "error");

      if (isReleace)
        if (!(await verifyCaptcha(obj.captcha, clientIP))) return sendHttpRes(res, 400, "error");

      /* success */
      sendHttpRes(
        res,
        200,
        encodeAuthToken({
          did: user._id.toString(),
          rol: user.role?.id || undefined,
          iss: version,
        })
      );
    },

    signup: async (res, req) => {
      const clientIP = getIP(res, req);

      const obj = await parseBody({ res });
      if (!signupValid(obj))
        return sendHttpRes(res, 400, signupValid.errors?.map((e) => e.message).join("\n"));

      obj.email = obj.email.toLowerCase();

      const isBusy = !!(await dbContext.Users.findByEmail(obj.email));
      if (isBusy) return sendHttpRes(res, 409, "error");

      if (isReleace && !(await verifyCaptcha(obj.captcha, clientIP)))
        return sendHttpRes(res, 400, "error");

      const confirmHash = obj.email + "&&" + randomString(64);

      const link = "/confirm/" + Buffer.from(confirmHash).toString("base64url");

      if (!(await getMailManager().sendEmail(ConfirmTemplate(obj.email, link))))
        return sendHttpRes(res, 400, "error");

      /* create to database user */
      const beginner = await dbContext.Users.create({
        email: obj.email,
        password: obj.password,
        nickname: obj.nickname,
        location: obj.location,
        confirmHash,
      });
      if (!beginner)
        return sendToSentry(new Error(`Failed create user: ${obj.email} ${obj.nickname}`), {
          ip: clientIP,
          tags: { signup: "fail_create" },
        });
      /* success */
      return sendHttpRes(res, 200, "Check email!");
    },

    confirm: async (res, req) => {
      const data = await parseBody<string>({
        res,
        parser: (b) => b.toString("ascii"),
      });
      if (typeof data !== "string") return sendHttpRes(res, 400, "invalid hash");

      const hash = Buffer.from(data, "base64url").toString("ascii");
      if (!hash) return sendHttpRes(res, 400, "Bad hash");

      const email = hash.split("&&")[0];
      if (!email) return sendHttpRes(res, 400, "invalid parse");

      const user = await dbContext.Users.findByEmail(email);
      if (!user || user?.confirmHash !== hash || user?.confirmed) return sendHttpRes(res, 400);

      user.confirmed = true;
      user.confirmHash = "";
      await user.save();
      sendHttpRes(
        res,
        200,
        encodeAuthToken({
          did: user._id.toString(),
          rol: user.role?.name || undefined,
          iss: version,
        })
      );
    },

    confirmnewemail: async (res, req) => {
      const data = await parseBody<string>({
        res,
        parser: (b) => b.toString("ascii"),
      });
      if (typeof data !== "string") return sendHttpRes(res, 400);

      const hash = Buffer.from(data, "base64url").toString("ascii");
      if (!hash) return sendHttpRes(res, 400);

      const [email, newemail] = hash.split("&&");
      if (!email || !newemail) return sendHttpRes(res, 400);

      if (!checkEmailValid(newemail)) return sendHttpRes(res, 400, "Email invalid");

      const user = await dbContext.Users.findByEmail(email);
      if (!user || user?.confirmHash !== hash || user?.confirmed) return sendHttpRes(res, 400);

      user.email = newemail;
      user.confirmHash = "";
      await user.save();
      sendHttpRes(res, 200);
    },

    forgot: async (res, req) => {
      const clientIP = getIP(res, req);

      const obj = await parseBody({ res });
      if (!ForgotPasswordValid(obj))
        return sendHttpRes(res, 400, ForgotPasswordValid.errors?.map((e) => e.message).join("\n"));

      obj.email = obj.email.toLowerCase();
      /* find to database user */
      const user = await dbContext.Users.findByEmail(obj.email);
      if (!user) return sendHttpRes(res, 400, "Bad Request");

      const verify = await verifyCaptcha(obj.captcha, clientIP);
      if (!verify) return sendHttpRes(res, 400, "Bad Request");

      const confirmHash = `${obj.email}&&${randomString(64)}`;

      const confirmLink = "/resetpassword/" + Buffer.from(confirmHash).toString("base64url");

      if (!(await getMailManager().sendEmail(ConfirmTemplate(obj.email, confirmLink))))
        return sendHttpRes(res, 400, "error");

      user.confirmHash = confirmHash;
      await user.save();

      return sendHttpRes(res, 200, "Check email!");
    },

    resetpass: async (res, req) => {
      const obj = await parseBody({ res });
      if (!reserPasswordValid(obj))
        return sendHttpRes(res, 400, reserPasswordValid.errors?.map((e) => e.message).join("\n"));

      const hash = Buffer.from(obj.confirm, "base64url").toString("ascii");
      if (!hash) return sendHttpRes(res, 400);

      const [email] = hash.split("&&");
      if (!email) return sendHttpRes(res, 400);

      const user = await dbContext.Users.findByEmail(email);
      if (!user || user.confirmHash !== hash || !user.confirmed) return sendHttpRes(res, 400);

      user.password = obj.password;

      await user.save();
      return sendHttpRes(res, 200);
    },

    question: async (res, req) => {
      const obj = await parseBody({ res });

      if (!questionValid(obj))
        return sendHttpRes(res, 400, questionValid.errors?.map((e) => e.message).join("\n"));

      obj.email = obj.email.toLowerCase();
      /* find to database user */
      const question = await dbContext.Questions.create({
        topic: obj.topic,
        body: obj.body,
        email: obj.email,
      });
      if (!question) return sendHttpRes(res, 400, "Ops");

      /* success */
      sendHttpRes(res, 200, "Thanks!");
    },
  },
};

export default accountHandlers;
