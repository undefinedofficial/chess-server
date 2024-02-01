// // import parseBody from "../utils/parseBody";
// import generateHash from "../utils/generateHash";
// import { Handlers } from "../wanderHandlers";
// import sendHttpRes from "../sendHttpRes";
// import getReqAuth from "../utils/getReqAuth";
// import {
//   getUserId,
//   getUserRoleId,
//   isAuthenticated,
//   isSuperUser,
// } from "../utils/authorization";
// import dbContext from "../database/dbContext";
// import Permissions from "../types/Permissions";
// import AuthToken from "../types/AuthToken";
// import sendPageModel from "../utils/sendPageModel";
// import { IUserDocument } from "../database/models/User";
// import { IQuestionDocument } from "../database/models/Question";
// import { IRoleDocument } from "../database/models/Role";
// import parseBody from "../utils/parseBody";
// import validate, { emailSchema, passwordSchema } from "../validates";
// import encodeAuthToken from "../utils/encodeAuthToken";
// import { isReleace, security } from "../configs";

// const key = "key";
// const value = security.ADMIN_PASS;

// // function SetCookie(res: HttpResponse, key = "key", value = certAdminKey) {
// //   res.writeHeader(
// //     "set-cookie",
// //     `${key}=${value}; Path=/api/secret; SameSite=Strict; Secure; max-age=5000`
// //   );
// // }

// // function IsAuthorized(req: HttpRequest) {
// //   const cookie = req.getHeader("cookie");
// //   if (!cookie) return false;

// //   return cookie.indexOf(certAdminKey, 3) > -1;
// // }

// const getauthValid = validate<{
//   login: string;
//   password: string;
//   key: string;
// }>({
//   type: "object",
//   properties: {
//     login: emailSchema as any,
//     password: passwordSchema as any,
//     key: {
//       type: "string",
//     },
//   },
//   required: ["login", "password", "key"],
//   errorMessage: "invalid model",
// });

// function UserToModel({
//   email,
//   updateEmail,
//   confirmed,
//   ban,
//   banCount,
//   role,
//   nickname,
//   updateNickname,
//   location,
//   lastOnline,
//   lastname,
//   firstname,
//   updatePassword,
//   elo,
//   winBattle,
//   lossBattle,
//   drawBattle,
//   createdAt,
// }: IUserDocument) {
//   return {
//     email,
//     updateEmail,
//     confirmed,
//     ban,
//     banCount,
//     role: role ? role.name : undefined,

//     nickname,
//     updateNickname,
//     location,
//     lastOnline,

//     lastname,
//     firstname,

//     updatePassword,

//     elo,
//     winBattle,
//     lossBattle,
//     drawBattle,
//     createdAt,
//   };
// }
// function QuestionToModel({
//   email,
//   topic,
//   id,
//   body,
//   createdAt,
// }: IQuestionDocument) {
//   return {
//     id,
//     email,
//     topic,
//     body,
//     createdAt,
//   };
// }
// function RoleToModel({
//   id,
//   name,
//   description,
//   permissions,
//   createdAt,
// }: IRoleDocument) {
//   return {
//     id,
//     name,
//     description,
//     permissions,
//     createdAt,
//   };
// }

// function name(res, req) {
//   const cookie = req.getHeader("cookie");
//   if (
//     cookie !==
//     `key=${security.ADMIN_PASS}; Path=/api/secret; SameSite=Strict; Secure; max-age=5000`
//   ) {
//     sendHttpRes(res, 404, isReleace ? "" : "Forbidden");
//     return true;
//   }
// }

// async function isAllowed(auth: AuthToken, perm: Permissions) {
//   const userId = getUserId(auth);
//   if (!userId) return false;
//   const user = await dbContext.Users.findById(userId).populate("role");
//   if (!user) return false;
//   return isSuperUser(auth) || user.role?.permissions.includes(perm);
// }

// const secretHandlers: Handlers = {
//   get: {
//     users: async (res, req) => {
//       const query = req.getQuery("q");
//       let skip = parseInt(req.getQuery("s")) || 0;
//       let limit = parseInt(req.getQuery("l")) || 10;

//       const auth = getReqAuth(req);
//       if (!isAuthenticated(auth))
//         return sendHttpRes(res, 401, "Not authorized");

//       if (!(await isAllowed(auth, "users.read")))
//         return sendHttpRes(res, 403, "Forbidden");

//       const users = await dbContext.Users.find({
//         $or: [
//           { nickname: { $regex: query, $options: "i" } },
//           { email: { $regex: query, $options: "i" } },
//         ],
//       }).populate("role");
//       const length = users.length;

//       sendHttpRes(res, 200, JSON.stringify(users.map(UserToModel)));
//     },
//     questions: async (res, req) => {
//       const query = req.getQuery("q");
//       let skip = parseInt(req.getQuery("s")) || 0;
//       let limit = parseInt(req.getQuery("l")) || 10;

//       const auth = getReqAuth(req);
//       if (!isAuthenticated(auth))
//         return sendHttpRes(res, 401, "Not authorized");

//       if (!(await isAllowed(auth, "question.read")))
//         return sendHttpRes(res, 403, "Forbidden");

//       const questions = await dbContext.Questions.find({
//         $or: [
//           { topic: { $regex: query, $options: "i" } },
//           { email: { $regex: query, $options: "i" } },
//         ],
//       }).sort({ createdAt: -1 });
//       const length = questions.length;

//       sendHttpRes(
//         res,
//         200,
//         sendPageModel({
//           limit,
//           skip,
//           length,
//           data: questions.slice(skip, skip + limit).map(QuestionToModel),
//         })
//       );
//     },
//     roles: async (res, req) => {
//       const query = req.getQuery("q");
//       let skip = parseInt(req.getQuery("s")) || 0;
//       let limit = parseInt(req.getQuery("l")) || 10;

//       const auth = getReqAuth(req);
//       if (!isAuthenticated(auth))
//         return sendHttpRes(res, 401, "Not authorized");

//       if (!(await isAllowed(auth, "roles.read")))
//         return sendHttpRes(res, 403, "Forbidden");

//       const questions = await dbContext.Roles.find({
//         $or: [{ name: { $regex: query, $options: "i" } }],
//       }).sort({ createdAt: -1 });
//       const length = questions.length;

//       sendHttpRes(
//         res,
//         200,
//         sendPageModel({
//           limit,
//           skip,
//           length,
//           data: questions.slice(skip, skip + limit).map(RoleToModel),
//         })
//       );
//     },
//   },
//   post: {
//     getauth: async (res, req) => {
//       const obj = await parseBody({ res });
//       if (!getauthValid(obj))
//         return sendHttpRes(
//           res,
//           400,
//           getauthValid.errors?.map((e) => e.message).join("\n")
//         );
//       obj.login = obj.login.toLowerCase();

//       /* find to database user */
//       const user = await dbContext.Users.findByEmail(obj.login);
//       if (!user) return sendHttpRes(res, 400, "error");

//       /* Password equal hashing */
//       if (user.password !== generateHash(obj.password) || !user.confirmed)
//         return sendHttpRes(res, 400, "error");

//       /* success */
//       sendHttpRes(
//         res,
//         200,
//         encodeAuthToken({
//           did: user._id.toString(),
//           sub: user.nickname,
//           rol: user.role?.name || undefined,
//         }),
//         {
//           "set-cookie": `key=${security.ADMIN_PASS}; Path=/api/secret; SameSite=Strict; Secure; max-age=5000`,
//         }
//       );
//     },
//   },
//   patch: {
//     userrole: async (res, req) => {
//       const userEmail = req.getQuery("e");
//       const roleId = req.getQuery("r");
//       if (!userEmail) return sendHttpRes(res, 400, "query invalid");

//       const auth = getReqAuth(req);
//       if (!isAuthenticated(auth))
//         return sendHttpRes(res, 401, "Not authorized");

//       if (!(await isAllowed(auth, "users.edit")))
//         return sendHttpRes(res, 403, "Forbidden");

//       const user = await dbContext.Users.findByEmail(userEmail);
//       if (!user) return sendHttpRes(res, 404, "Not found user");

//       if (roleId) {
//         const role = await dbContext.Roles.findById(roleId);
//         user.role = role;
//       } else user.role = null;
//       await user.save();

//       sendHttpRes(res, 200, JSON.stringify(UserToModel(user)));
//     },
//   },
//   //   post: {
//   //     signin: async (res, req) => {
//   //       const clientIP = getIP(res, req);
//   //       const obj = await parseBody({ res });
//   //       if (!signinValid(obj))
//   //         return sendHttpRes(res, 400, signinValid.errors?.map((e) => e.message).join("\n"));
//   //       obj.email = obj.email.toLowerCase();
//   //       /* find to database user */
//   //       const user = await dbContext.Users.FindByEmail(obj.email);
//   //       if (!user) return sendHttpRes(res, 400, "error");
//   //       /* Password equal hashing */
//   //       if (user.password !== generateHash(obj.password) || !user.confirmed)
//   //         return sendHttpRes(res, 400, "error");
//   //       if (isReleace)
//   //         if (!(await verifyCaptcha(obj.captcha, clientIP))) return sendHttpRes(res, 400, "error");
//   //       /* success */
//   //       sendHttpRes(
//   //         res,
//   //         200,
//   //         encodeAuthToken({
//   //           did: user._id.toString(),
//   //           sub: user.nickname,
//   //           rol: user.role?.name || undefined,
//   //         })
//   //       );
//   //     },
//   //     signup: async (res, req) => {
//   //       const clientIP = getIP(res, req);
//   //       const obj = await parseBody({ res });
//   //       if (!signupValid(obj))
//   //         return sendHttpRes(res, 400, signupValid.errors?.map((e) => e.message).join("\n"));
//   //       obj.email = obj.email.toLowerCase();
//   //       const isBusy = !!(await dbContext.Users.FindByEmail(obj.email));
//   //       if (isBusy) return sendHttpRes(res, 409, "error");
//   //       if (isReleace && !(await verifyCaptcha(obj.captcha, clientIP)))
//   //         return sendHttpRes(res, 400, "error");
//   //       const confirmHash = obj.email + "&&" + randomString(64);
//   //       const link = "/confirm/" + Buffer.from(confirmHash).toString("base64url");
//   //       if (!(await getMailManager().sendEmail(ConfirmTemplate(obj.email, link))))
//   //         return sendHttpRes(res, 400, "error");
//   //       /* create to database user */
//   //       const beginner = await dbContext.Users.Create({
//   //         email: obj.email,
//   //         password: obj.password,
//   //         nickname: obj.nickname,
//   //         location: obj.location,
//   //         confirmHash,
//   //       });
//   //       if (!beginner)
//   //         return sendToSentry(new Error(`Failed create user: ${obj.email} ${obj.nickname}`), {
//   //           ip: clientIP,
//   //           tags: { signup: "fail_create" },
//   //         });
//   //       /* success */
//   //       return sendHttpRes(res, 200, "Check email!");
//   //     },
//   //     confirm: async (res, req) => {
//   //       const data = await parseBody<string>({ res, parser: (b) => b.toString("ascii") });
//   //       if (typeof data !== "string") return sendHttpRes(res, 400, "invalid hash");
//   //       const hash = Buffer.from(data, "base64url").toString("ascii");
//   //       if (!hash) return sendHttpRes(res, 400, "Bad hash");
//   //       const email = hash.split("&&")[0];
//   //       if (!email) return sendHttpRes(res, 400, "invalid parse");
//   //       const user = await dbContext.Users.FindByEmail(email);
//   //       if (!user || user?.confirmHash !== hash || user?.confirmed) return sendHttpRes(res, 400);
//   //       await dbContext.Users.UpdateConfirm(user, true);
//   //       await dbContext.Users.ResetConfirmHash(user);
//   //       sendHttpRes(
//   //         res,
//   //         200,
//   //         encodeAuthToken({
//   //           did: user._id.toString(),
//   //           sub: user.nickname,
//   //           rol: user.role?.name || undefined,
//   //         })
//   //       );
//   //     },
//   //     confirmnewemail: async (res, req) => {
//   //       const data = await parseBody<string>({ res, parser: (b) => b.toString("ascii") });
//   //       if (typeof data !== "string") return sendHttpRes(res, 400);
//   //       const hash = Buffer.from(data, "base64url").toString("ascii");
//   //       if (!hash) return sendHttpRes(res, 400);
//   //       const [email, newemail] = hash.split("&&");
//   //       if (!email || !newemail) return sendHttpRes(res, 400);
//   //       if (!checkEmailValid(newemail)) return sendHttpRes(res, 400, "Email invalid");
//   //       const user = await dbContext.Users.FindByEmail(email);
//   //       if (!user || user?.confirmHash !== hash || user?.confirmed) return sendHttpRes(res, 400);
//   //       await dbContext.Users.UpdateEmail(user, newemail);
//   //       await dbContext.Users.ResetConfirmHash(user);
//   //       sendHttpRes(res, 200);
//   //     },
//   //     forgot: async (res, req) => {
//   //       const clientIP = getIP(res, req);
//   //       const obj = await parseBody({ res });
//   //       if (!ForgotPasswordValid(obj))
//   //         return sendHttpRes(res, 400, ForgotPasswordValid.errors?.map((e) => e.message).join("\n"));
//   //       obj.email = obj.email.toLowerCase();
//   //       /* find to database user */
//   //       const user = await dbContext.Users.FindByEmail(obj.email);
//   //       if (!user) return sendHttpRes(res, 400, "Bad Request");
//   //       const verify = await verifyCaptcha(obj.captcha, clientIP);
//   //       if (!verify) return sendHttpRes(res, 400, "Bad Request");
//   //       const confirmHash = `${obj.email}&&${randomString(64)}`;
//   //       const confirmLink = "/resetpassword/" + Buffer.from(confirmHash).toString("base64url");
//   //       if (!(await getMailManager().sendEmail(ConfirmTemplate(obj.email, confirmLink))))
//   //         return sendHttpRes(res, 400, "error");
//   //       await dbContext.Users.UpdateConfirmHash(user, confirmHash);
//   //       return sendHttpRes(res, 200, "Check email!");
//   //     },
//   //     resetpass: async (res, req) => {
//   //       const obj = await parseBody({ res });
//   //       if (!reserPasswordValid(obj))
//   //         return sendHttpRes(res, 400, reserPasswordValid.errors?.map((e) => e.message).join("\n"));
//   //       const hash = Buffer.from(obj.confirm, "base64url").toString("ascii");
//   //       if (!hash) return sendHttpRes(res, 400);
//   //       const [email] = hash.split("&&");
//   //       if (!email) return sendHttpRes(res, 400);
//   //       const user = await dbContext.Users.FindByEmail(email);
//   //       if (!user || user.confirmHash !== hash || !user.confirmed) return sendHttpRes(res, 400);
//   //       await dbContext.Users.UpdatePassword(user, obj.password);
//   //       return sendHttpRes(res, 200);
//   //     },
//   //     question: async (res, req) => {
//   //       const obj = await parseBody({ res });
//   //       if (!questionValid(obj))
//   //         return sendHttpRes(res, 400, questionValid.errors?.map((e) => e.message).join("\n"));
//   //       obj.email = obj.email.toLowerCase();
//   //       /* find to database user */
//   //       const question = await dbContext.Questions.Create({
//   //         topic: obj.topic,
//   //         body: obj.body,
//   //         email: obj.email,
//   //       });
//   //       if (!question) return sendHttpRes(res, 400, "Ops");
//   //       /* success */
//   //       sendHttpRes(res, 200, "Thanks!");
//   //     },
//   //   },
// };

// export default secretHandlers;
