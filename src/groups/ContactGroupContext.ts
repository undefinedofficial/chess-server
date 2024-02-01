import {
  Color,
  GameMode,
  CHESSMODE,
  BATTLETYPE,
  RequestBattle,
} from "../types/DataProto";
import ConnectionContext from "../socketHelpers/ConnectionContext";
import { sendEncodedMessage } from "../socketHelpers/sendEncodedMessage";
import GroupContext from "./GroupContext";
import { isAuthenticated } from "../utils/authorization";
import lotteryOrientations from "../utils/lotteryOrientation";
import OnlineGameGroupContext from "./OnlineGameGroupContext";
import WSGroups from "../WSGroups";

interface ConnectedSub {
  id: string;
  mode: CHESSMODE;
  color: Color;
  ctx: ConnectionContext;
  oponent: ConnectionContext;
}

class ContactGroupContext extends GroupContext {
  subs: ConnectionContext[] = [];
  forms: Record<string, ConnectedSub> = {};

  constructor() {
    super({ id: "cntct" });
  }

  sendAbort(ctx: ConnectionContext, oponent: string) {
    sendEncodedMessage(ctx, {
      t: BATTLETYPE.REJECT_BATTLE,
      s: this.id,
      p: oponent,
    });
  }

  handleConnect(ctx: ConnectionContext): boolean {
    if (!isAuthenticated(ctx.authToken)) return true;
    this.subs.push(ctx);
    return true;
  }
  handleMessage(
    ctx: ConnectionContext,
    type: BATTLETYPE,
    payload: unknown
  ): boolean {
    switch (type) {
      case BATTLETYPE.REQUEST_BATTLE:
        const { color, mode, oponent } = payload as RequestBattle;
        if (
          typeof color !== "string" ||
          typeof mode !== "string" ||
          typeof oponent !== "string"
        )
          return true;

        const oponentCtx = this.subs.find((s) => s.nickname === oponent);
        if (!oponentCtx) {
          this.sendAbort(ctx, oponent);
          return true;
        }

        const form: ConnectedSub = {
          id: ctx.nickname + oponentCtx.nickname,
          color,
          mode,
          ctx,
          oponent: oponentCtx,
        };
        this.forms[form.id] = form;

        sendEncodedMessage(oponentCtx, {
          t: BATTLETYPE.REQUEST_BATTLE,
          s: this.id,
          p: {
            id: form.id,
            color: form.color,
            mode: form.mode,
            oponent: form.ctx.nickname,
          } as RequestBattle,
        });
        break;
      case BATTLETYPE.ACCEPT_BATTLE: {
        const form = this.forms[payload as string];
        if (!form || form.oponent !== ctx) break;

        const { white, black } = lotteryOrientations(
          { color: form.color, user: form.ctx },
          { color: "wb", user: form.oponent }
        );

        /* Room success created send pairs about room id */
        const room = new OnlineGameGroupContext({
          mode: form.mode,
          white: white.authToken,
          black: black.authToken,
          isReward: false,
        });
        WSGroups.set(room);

        sendEncodedMessage(white, {
          t: BATTLETYPE.ACCEPT_BATTLE,
          s: this.id,
          p: room.id,
        });
        sendEncodedMessage(black, {
          t: BATTLETYPE.ACCEPT_BATTLE,
          s: this.id,
          p: room.id,
        });
        break;
      }
      case BATTLETYPE.REJECT_BATTLE: {
        const form = this.forms[payload as string];
        if (!form || form.oponent !== ctx) break;

        sendEncodedMessage(form.ctx, {
          t: type,
          s: this.id,
          p: form.id,
        });
        break;
      }
    }
    return true;
  }
  handleClose(ctx: ConnectionContext): void {
    if (!isAuthenticated(ctx.authToken)) return;

    this.subs = this.subs.filter((s) => s !== ctx);
    Object.values(this.forms).forEach((w) => {
      if (w.oponent === ctx) this.sendAbort(w.ctx, ctx.nickname);
    });
  }
}

export default new ContactGroupContext();
