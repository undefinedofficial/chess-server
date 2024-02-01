import { LeanDocument } from "mongoose";
import { IUserDocument } from "../database/models/User";

type PrivateUser = Omit<LeanDocument<IUserDocument> | IUserDocument, "password" | "confirmHash">;
type PublicUser = Omit<LeanDocument<PrivateUser> | IUserDocument, "email">;

function userToJSON(user: PrivateUser | PrivateUser[]): string {
  function select(user: PrivateUser) {
    return {
      email: user.email,
      updateEmail: user.updateEmail,
      confirmed: user.confirmed,
      ban: user.ban,
      role: user.role ? user.role.name : undefined,

      nickname: user.nickname,
      updateNickname: user.updateNickname,

      avatar: user.avatar,
      location: user.location,
      lastOnline: user.lastOnline,

      lastname: user.name.last,
      firstname: user.name.first,

      updatePassword: user.updatePassword,

      elo: user.elo,
      winBattle: user.winBattle,
      lossBattle: user.lossBattle,
      drawBattle: user.drawBattle,
    };
  }

  if (Array.isArray(user)) return JSON.stringify(user.map(select));
  return JSON.stringify(select(user));
}

function userToJSONsm(user: PublicUser | PublicUser[]): string {
  function select(user: PublicUser) {
    return {
      nickname: user.nickname,

      avatar: user.avatar,
      location: user.location,
      lastOnline: user.lastOnline,

      lastname: user.name.last,
      firstname: user.name.first,

      elo: user.elo,
      winBattle: user.winBattle,
      lossBattle: user.lossBattle,
      drawBattle: user.drawBattle,
    };
  }

  if (Array.isArray(user)) return JSON.stringify(user.map(select));
  return JSON.stringify(select(user));
}

export { userToJSON, userToJSONsm };
