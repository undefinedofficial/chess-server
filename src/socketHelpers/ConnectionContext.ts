import { WebSocket } from "uWebSockets.js";
import AuthToken from "../types/AuthToken";
import GroupContext from "../groups/GroupContext";
import SessionToken from "../types/SessionToken";
import UserData from "./UserData";
import randomString from "../utils/randomString";
import dbContext from "../database/dbContext";
import { getUserId, isAuthenticated } from "../utils/authorization";
import WSClients from "../WSClients";

interface ConnectedSubs {
  [gId: string]: GroupContext | undefined;
}

type Token = AuthToken | SessionToken;

class ConnectionContext {
  id: string;
  nickname: string;
  socket: WebSocket<UserData>;
  groups: ConnectedSubs = {};

  constructor(public readonly authToken: Token, public readonly ip: string) {
    this.id = `user_${randomString()}`;
  }

  async created(socket: WebSocket<UserData>) {
    this.socket = socket;
    if (!isAuthenticated(this.authToken)) {
      this.nickname = this.authToken.sub;
      return;
    }
    const id = getUserId(this.authToken);
    const connections = WSClients.getByDId(id);

    if (connections.length === 0) {
      const user = (await dbContext.Users.findById(id))!;
      await user?.switchOnline(true);
      this.nickname = user.nickname;
      this.authToken.sub = user.nickname;
    }
  }

  async destroyed() {
    if (isAuthenticated(this.authToken)) {
      const id = getUserId(this.authToken);
      const connections = WSClients.getByDId(id);

      if (connections.length === 1)
        await dbContext.Users.findById(id).then((u) => u?.switchOnline(false));
    }
  }
}

export default ConnectionContext;
