import getReqAuth from "../utils/getReqAuth";
import { Handlers } from "../wanderHandlers";
import sendHttpRes from "../sendHttpRes";
import { getUserId, isAuthenticated } from "../utils/authorization";
import dbContext from "../database/dbContext";
import { userToJSON, userToJSONsm } from "../utils/userToJSON";
import validate, { emailSchema, nameSchema, nickSchema, passwordSchema } from "../validates";
import parseBody from "../utils/parseBody";
import generateHash from "../utils/generateHash";
import { writeFileSync } from "fs";
import parseFormBody from "../utils/parseFormBody";
import randomString from "../utils/randomString";
import { avatarsPath, isReleace } from "../configs";
import getMailManager from "../email/getMailManager";
import ConfirmTemplate from "../email/template/ConfirmTemplate";
import WSGroups from "../WSGroups";
import sendToSentry from "../utils/sendToSentry";
import sendPageModel from "../utils/sendPageModel";
import encodeAuthToken from "../utils/encodeAuthToken";
import generateUID from "../utils/generateUID";
import { IRoom } from "../database/models/Room";
import roomsToJSON from "../utils/roomToJSON";

const checkNickValid = validate<string>(nickSchema);

const changeEmailValid = validate<{
  email: string;
}>({
  type: "object",
  properties: {
    email: emailSchema as any,
  },
  required: ["email"],
  errorMessage: {
    required: "invalid model",
  },
});
const changeNicknameValid = validate<{
  nickname: string;
}>({
  type: "object",
  properties: {
    nickname: nickSchema as any,
  },
  required: ["nickname"],
  errorMessage: {
    required: "invalid model",
  },
});
const changeNameValid = validate<{
  lastname: string;
  firstname: string;
}>({
  type: "object",
  properties: {
    lastname: nameSchema as any,
    firstname: nameSchema as any,
  },
});
const changePasswordValid = validate<{
  oldpassword: string;
  newpassword: string;
}>({
  type: "object",
  properties: {
    oldpassword: passwordSchema as any,
    newpassword: passwordSchema as any,
  },
  required: ["oldpassword", "newpassword"],
  errorMessage: {
    required: "invalid model",
  },
});

const changeEmojiValid = validate<{
  emoji: number;
  elo: number;
  skill: number;
  err_prob: number;
  max_err: number;
  message: string;
}>({
  type: "object",
  properties: {
    emoji: { type: "number", minimum: -1, maximum: 1 },
    elo: { type: "number", minimum: 0, maximum: 3000 },
    skill: { type: "number", minimum: 0, maximum: 20 },
    err_prob: { type: "number", minimum: 0, maximum: 10000 },
    max_err: { type: "number", minimum: 0, maximum: 10000 },
    message: { type: "string", maxLength: 768 },
  },
  required: ["emoji", "elo", "skill", "err_prob", "max_err", "message"],
  errorMessage: {
    required: "invalid model",
    minimum: "ivalid minimum value",
    maximum: "ivalid maximum value",
  },
});

const profileHandlers: Handlers = {
  get: {
    me: async (res, req) => {
      const auth = getReqAuth(req);
      if (!isAuthenticated(auth)) return sendHttpRes(res, 401, "Not authorized");
      const user = await dbContext.Users.findById(getUserId(auth));
      if (!user) return sendHttpRes(res, 401, "Not authorized");
      sendHttpRes(res, 200, userToJSON(user));
    },

    nick: async (res, req) => {
      const nickname = req.getQuery("n");
      const auth = getReqAuth(req);
      if (!checkNickValid(nickname))
        return sendHttpRes(res, 400, checkNickValid.errors?.map((e) => e.message).join("\n"));

      const user = await dbContext.Users.findByNickname(nickname);
      if (!user) return sendHttpRes(res, 404);

      if (isAuthenticated(auth) && getUserId(auth) === user.id)
        return sendHttpRes(res, 200, userToJSON(user));

      sendHttpRes(res, 200, userToJSONsm(user));
    },

    rooms: async (res, req) => {
      const nickname = req.getQuery("n");
      let skip = parseInt(req.getQuery("s")) || 0;
      let limit = parseInt(req.getQuery("l")) || 10;

      if (!checkNickValid(nickname))
        return sendHttpRes(res, 400, checkNickValid.errors?.map((e) => e.message).join("\n"));

      const user = await dbContext.Users.findByNickname(nickname);

      if (!user) return sendHttpRes(res, 404);

      let rooms: IRoom[] = [];
      if (skip === 0) {
        const liveRooms = WSGroups.findGameRoomsByUserId(user.id);
        if (liveRooms.length) rooms.push(...liveRooms.map((r) => r.GetRoom()));
      }
      const query = await dbContext.Rooms.find({
        $or: [{ white: user }, { black: user }],
      })
        .populate(["white", "black"])
        .sort({ createdAt: -1 });

      const length = query.length;

      rooms.push(...(query.slice(skip, skip + limit) as any));

      return sendHttpRes(
        res,
        200,
        sendPageModel({
          data: roomsToJSON(rooms) as any,
          length,
          limit,
          skip,
        }),
        {
          "content-type": "application/json",
        }
      );
    },
  },
  post: {
    avatar: async (res, req) => {
      const contentTypeHeader = req.getHeader("content-type");

      const auth = getReqAuth(req);
      if (!isAuthenticated(auth)) return sendHttpRes(res, 401, "Not authorized");

      const files = await parseFormBody({
        res,
        contentType: contentTypeHeader,
      });
      if (!files || files?.length !== 1) return sendHttpRes(res, 400);
      const file = files[0];

      const user = await dbContext.Users.findById(getUserId(auth));
      if (!user) return sendHttpRes(res, 401, "Not authorized");

      if (file.type !== "image/png") return sendHttpRes(res, 400);

      user.updateAvatar(generateUID());

      const fullpath = avatarsPath + user.avatar;
      writeFileSync(fullpath, Buffer.from(file.data), {
        encoding: "binary",
        flag: "w",
      });

      sendHttpRes(res, 200, userToJSON(user));
    },
    useremoji: async (res, req) => {
      const auth = getReqAuth(req);
      if (!isAuthenticated(auth)) return sendHttpRes(res, 401, "Not authorized");

      const obj = await parseBody({ res });

      if (!changeEmojiValid(obj))
        return sendHttpRes(res, 400, changeEmojiValid.errors?.map((e) => e.message).join("\n"));
      const { elo, emoji, err_prob, max_err, skill, message } = obj;

      const EmojiToString = (i: number) => {
        switch (i) {
          case -1:
            return "Недоволен";
          case 0:
            return "Нейтрален";
          case 1:
            return "Доволен";
        }
      };

      await sendToSentry(
        new Error(`User: ${getUserId(auth)} \n ${EmojiToString(emoji)}\nMessage: ${message}`),
        {
          userId: getUserId(auth),
          tags: {
            elo: elo.toString(),
            skill: skill.toString(),
            "Err Prob": err_prob.toString(),
            "Max Err": max_err.toString(),
          },
        }
      );

      sendHttpRes(res, 200, "Thanks!");
    },
  },
  delete: {
    avatar: async (res, req) => {
      const auth = getReqAuth(req);
      if (!isAuthenticated(auth)) return sendHttpRes(res, 401, "Not authorized");

      const user = await dbContext.Users.findById(getUserId(auth));
      if (!user) return sendHttpRes(res, 401, "Not authorized");

      await user.updateAvatar();

      sendHttpRes(res, 200, userToJSON(user));
    },
  },
  put: {
    email: async (res, req) => {
      const auth = getReqAuth(req);
      const obj = await parseBody({ res });
      if (!changeEmailValid(obj))
        return sendHttpRes(res, 400, changeEmailValid.errors?.map((e) => e.message).join("\n"));

      if (!isAuthenticated(auth)) return sendHttpRes(res, 401, "Not authorized");

      const user = await dbContext.Users.findById(getUserId(auth));
      if (!user) return sendHttpRes(res, 401, "Not authorized");

      if (isReleace) {
        const nowdate = new Date().getDate();
        if (user.updateEmail.getDate() - nowdate < 30) return sendHttpRes(res, 400, "early");
      }

      obj.email = obj.email.toLowerCase();

      const confirmHash = `${user.email}&&${obj.email}&&${randomString(64)}`;

      /* Generate old email for find DB + hash */
      const confirmLink = "/confirmmail/" + Buffer.from(confirmHash).toString("base64url");

      if (!(await getMailManager().sendEmail(ConfirmTemplate(obj.email, confirmLink))))
        return sendHttpRes(res, 400, "error");

      user.confirmHash = confirmHash;
      await user.save();

      return sendHttpRes(res, 200, "Check email!");
    },
    nickname: async (res, req) => {
      const auth = getReqAuth(req);
      const obj = await parseBody({ res });
      if (!changeNicknameValid(obj))
        return sendHttpRes(res, 400, changeNicknameValid.errors?.map((e) => e.message).join("\n"));

      if (!isAuthenticated(auth)) return sendHttpRes(res, 401, "Not authorized");

      const user = await dbContext.Users.findById(getUserId(auth));
      if (!user) return sendHttpRes(res, 401, "Not authorized");

      if (isReleace) {
        const nowdate = new Date().getDate();
        if (user.updateNickname.getDate() - nowdate < 30) return sendHttpRes(res, 400, "early");
      }

      user.nickname = obj.nickname;
      await user.save();

      sendHttpRes(
        res,
        200,
        encodeAuthToken({
          did: user._id.toString(),
          sub: user.nickname,
          rol: user.role?.name || undefined,
        })
      );
    },
    name: async (res, req) => {
      const auth = getReqAuth(req);
      const obj = await parseBody({ res });

      if (!changeNameValid(obj))
        return sendHttpRes(res, 400, changeNameValid.errors?.map((e) => e.message).join("\n"));

      if (!isAuthenticated(auth)) return sendHttpRes(res, 401, "Not authorized");

      const user = await dbContext.Users.findById(getUserId(auth));
      if (!user) return sendHttpRes(res, 401, "Not authorized");

      user.name = {
        last: obj.lastname,
        first: obj.firstname,
      };
      await user.save();

      sendHttpRes(res, 200);
    },
    password: async (res, req) => {
      const auth = getReqAuth(req);
      const obj = await parseBody({ res });
      if (!changePasswordValid(obj))
        return sendHttpRes(res, 400, changePasswordValid.errors?.map((e) => e.message).join("\n"));

      if (!isAuthenticated(auth)) return sendHttpRes(res, 401, "Not authorized");

      const user = await dbContext.Users.findById(getUserId(auth));
      if (!user) return sendHttpRes(res, 401, "Not authorized");

      if (user?.password !== generateHash(obj.oldpassword))
        return sendHttpRes(res, 400, "oldpassword");

      user.password = obj.newpassword;
      await user.save();
      sendHttpRes(res, 200, "S_OK");
    },
  },
};

export default profileHandlers;
