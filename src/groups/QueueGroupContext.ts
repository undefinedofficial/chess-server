import {
  Color,
  REQTYPE,
  GameMode,
  CHESSMODE,
  BATTLETYPE,
  ROOMTYPE,
  RequestBattle,
} from "../types/DataProto";
import ConnectionContext from "../socketHelpers/ConnectionContext";
import { sendEncodedMessage } from "../socketHelpers/sendEncodedMessage";
import GroupContext from "./GroupContext";
import checkBotId from "../utils/checkBotId";
import BotGameGroupContext from "./BotGameGroupContext";
import OnlineGameGroupContext from "./OnlineGameGroupContext";
import WSGroups from "../WSGroups";
import TelemetryGroupContext from "./TelemetryGroupContext";
import lotteryOrientations from "../utils/lotteryOrientation";
import { isAuthenticated } from "../utils/authorization";

interface ConnectedSub {
  mode: CHESSMODE;
  color: Color;
  ctx: ConnectionContext;
}

class QueueGroupContext extends GroupContext {
  gSubs: ConnectedSub[] = [];
  aSubs: ConnectedSub[] = [];

  constructor() {
    super({ id: "queue" });
  }

  FindQueueUser(ctx: ConnectionContext, mode: CHESSMODE, color: Color) {
    const Find = (s: ConnectedSub) =>
      s.ctx.authToken.sub !== ctx.authToken.sub &&
      s.mode === mode &&
      (s.color !== color || s.color === "wb" || color === "wb");

    if (isAuthenticated(ctx.authToken)) return this.aSubs.find(Find);

    return this.gSubs.find(Find);
  }
  PushQueueUser(sub: ConnectedSub) {
    if (isAuthenticated(sub.ctx.authToken)) this.aSubs.push(sub);
    else this.gSubs.push(sub);

    switch (sub.mode) {
      case "BULLET10":
        TelemetryGroupContext.Bullet++;
        break;

      case "BLITZ50":
        TelemetryGroupContext.Blitz++;
        break;
      case "RAPID100":
        TelemetryGroupContext.Rapid++;
        break;
    }
  }
  DelQueueUser(ctx: ConnectionContext) {
    let sub: ConnectedSub | undefined;
    if (isAuthenticated(ctx.authToken)) {
      const idx = this.aSubs.findIndex((s) => s.ctx === ctx);
      if (idx < 0) return;
      sub = this.aSubs.splice(idx, 1)[0];
    } else {
      const idx = this.gSubs.findIndex((s) => s.ctx === ctx);
      if (idx < 0) return;
      sub = this.gSubs.splice(idx, 1)[0];
    }
    if (!sub) return;

    switch (sub.mode) {
      case "BULLET10":
        TelemetryGroupContext.Bullet--;
        break;
      case "BLITZ50":
        TelemetryGroupContext.Blitz--;
        break;
      case "RAPID100":
        TelemetryGroupContext.Rapid--;
        break;
    }
  }

  handleConnect(ctx: ConnectionContext, { color = "wb", mode }: GameMode): boolean {
    if (checkBotId(mode)) {
      const room = new BotGameGroupContext({
        mode,
        color,
        clock: 0,
        player: ctx.authToken,
      });
      WSGroups.set(room);

      sendEncodedMessage(ctx, { t: BATTLETYPE.START_BATTLE, s: this.id, p: room.id });
      return true;
    }

    const enemy = this.FindQueueUser(ctx, mode, color);
    /* added this user in queue */
    if (!enemy) {
      this.PushQueueUser({ ctx, color, mode });
      sendEncodedMessage(ctx, { t: BATTLETYPE.WAIT_BATTLE, s: this.id });
      return true;
    }
    this.DelQueueUser(enemy.ctx);

    const { white, black } = lotteryOrientations(
      { color, user: ctx },
      { color: enemy.color, user: enemy.ctx }
    );

    /* Room success created send pairs about room id */
    const room = new OnlineGameGroupContext({
      mode,
      white: white.authToken,
      black: black.authToken,
      isReward: true,
    });
    WSGroups.set(room);

    sendEncodedMessage(white, { t: BATTLETYPE.START_BATTLE, s: this.id, p: room.id });
    sendEncodedMessage(black, { t: BATTLETYPE.START_BATTLE, s: this.id, p: room.id });
    return true;
  }
  handleMessage(ctx: ConnectionContext, type: number, payload: unknown): boolean {
    return true;
  }
  handleClose(ctx: ConnectionContext): void {
    this.DelQueueUser(ctx);
  }
}

export default new QueueGroupContext();
