import { Chess, PartialMove } from "chess.ts";
import ConnectionContext from "../socketHelpers/ConnectionContext";
import GroupContext from "./GroupContext";
import { Token } from "../types/Token";

import {
  Message,
  RoomResult,
  RoomJson,
  ROOMSTATUS,
  CHESSMODE,
  RoomMeta,
  ROOMTYPE,
  REQTYPE,
  JsonPayload,
} from "../types/DataProto";
import { getUserId, isAuthenticated } from "../utils/authorization";
import { publishEncodedMessage, sendEncodedMessage } from "../socketHelpers/sendEncodedMessage";
import dbContext from "../database/dbContext";
import { IUserDocument } from "../database/models/User";
import WSGroups from "../WSGroups";
import GameTimer, { Directions } from "../helpers/GameTimer";
import sendToSentry from "../utils/sendToSentry";
import eloCalc from "../utils/eloCalc";
import TelemetryGroupContext from "./TelemetryGroupContext";
import { IRoom } from "../database/models/Room";
import roomsToJSON from "../utils/roomToJSON";

interface Options {
  mode: CHESSMODE;
  white?: Token;
  black?: Token;
  clock?: number;
  room_id: string; // room always begined 'o' for online or 'b' for bots
  fen?: string;
  isReward?: boolean;
  isPrivacy?: boolean;
}

interface RoomMetaType extends Omit<RoomMeta, "white" | "black"> {
  white?: Token;
  black?: Token;
}

const msInDay = 86400000;

export { Options };

abstract class IGameGroupContext<timerT extends GameTimer = GameTimer> extends GroupContext {
  protected readonly chess: Chess;

  protected readonly clocks: number[] = [];
  public readonly meta: RoomMetaType;

  protected readonly messages: Message[] = [];
  protected result?: RoomResult;

  protected readonly isReward: boolean;

  protected timer: timerT;

  subs: ConnectionContext[] = [];

  constructor(options: Options) {
    const {
      room_id,
      mode,
      white,
      black,
      fen,
      isReward = false,
      clock = 240,
      isPrivacy = false,
    } = options;
    super({ id: room_id });
    this.chess = new Chess(fen);

    this.isReward = isReward;

    this.meta = {
      mode,
      white,
      black,
      clock,
      status: ROOMSTATUS.PREMIERE,
      createdAt: new Date(),
      isPrivacy: isPrivacy,
    };

    if (!isAuthenticated(this.meta.white) && !isAuthenticated(this.meta.black)) {
      setTimeout(() => {
        WSGroups.delete(this.id);
        TelemetryGroupContext.Parts--;
      }, msInDay);
    }

    TelemetryGroupContext.Parts++;
  }

  protected JoinUser(ctx: ConnectionContext) {
    this.SendAll({ t: ROOMTYPE.JOIN_USER, p: ctx.nickname });
    this.SendCall(ctx, { t: REQTYPE.JOIN_ROOM, p: roomsToJSON(this.GetRoom()) });

    this.subs.push(ctx);
    ctx.socket.subscribe(this.id);

    this.SendCall(ctx, {
      t: ROOMTYPE.GET_USERS,
      p: this.subs.map((s) => s.authToken.sub),
    });

    // TelemetryGroupContext.Players++;
  }
  protected LeaveUser(ctx: ConnectionContext) {
    const { done } = ctx.socket.getUserData();

    if (!done) ctx.socket.unsubscribe(this.id);

    this.subs = this.subs.filter((s) => s !== ctx);
    this.SendAll({
      t: ROOMTYPE.LEAVE_USER,
      p: ctx.nickname,
    });
  }

  protected SendStatus(status: ROOMSTATUS) {
    this.meta.status = status;
    this.SendAll({
      t: ROOMTYPE.NEW_ROOMSTATUS,
      p: this.meta.status,
    });
  }

  protected IsWhitePlayer(ctx: ConnectionContext) {
    return ctx.nickname === this.meta.white?.sub;
  }
  protected IsBlackPlayer(ctx: ConnectionContext) {
    return ctx.nickname === this.meta.black?.sub;
  }
  protected IsPlayer(ctx: ConnectionContext) {
    return this.IsWhitePlayer(ctx) || this.IsBlackPlayer(ctx);
  }

  protected NextMove(parentMove: PartialMove) {
    const move = this.chess.move(parentMove);
    if (!move) {
      console.warn("NextMove: move invalid", move);
      return false;
    }

    const clock = this.chess.turn() === "w" ? this.timer.GetTimeWhite : this.timer.GetTimeBlack;
    this.clocks.push(clock);

    this.timer.Turn = this.chess.turn();

    this.SendAll({
      t: ROOMTYPE.NEW_HISTORY,
      p: {
        san: move.san,
        clock,
      },
    });
    return true;
  }
  protected UndoMove() {
    if (this.chess.undo()) {
      this.clocks.pop();
      this.SendAll({ t: ROOMTYPE.DEL_HISTORY });
      return true;
    }
    return false;
  }
  protected async GameOver(status: ROOMSTATUS) {
    this.SendStatus(status);
    this.timer.Play = false;

    if (!isAuthenticated(this.meta.white) && !isAuthenticated(this.meta.black)) {
      return;
    }

    if (this.clocks.length > 2) {
      if (this.isReward && this.meta.white && this.meta.black) {
        const white = await dbContext.Users.findById(getUserId(this.meta.white));
        const black = await dbContext.Users.findById(getUserId(this.meta.black));
        if (white && black) {
          let end: 1 | 0 | 0.5;
          switch (status) {
            case ROOMSTATUS.WHITE_WIN:
              end = 1;
              white.winBattle++;
              black.lossBattle++;
              break;
            case ROOMSTATUS.BLACK_WIN:
              end = 0;
              white.lossBattle++;
              black.winBattle++;
              break;
            case ROOMSTATUS.STALEMATE:
            case ROOMSTATUS.STALEMATE_SURRENDER:
              end = 0.5;
              white.drawBattle++;
              black.drawBattle++;
              break;
            default:
              return;
          }
          let k: number = 5;
          switch (this.meta.mode) {
            case "BULLET10":
              k = 5;
              break;
            case "BLITZ50":
              k = 10;
              break;
            case "RAPID100":
              k = 15;
              break;
            default:
              sendToSentry(new Error("BotGameGroupContext: end game mode: " + this.meta.mode));
          }
          const elo = eloCalc(white.elo, black.elo, end, k);

          white.elo += elo.white;
          black.elo += elo.black;

          await white.save();
          await black.save();

          this.result = {
            whiteElo: white.elo,
            blackElo: black.elo,
            whiteScore: elo.white,
            blackScore: elo.black,
          };
          const players = this.subs.filter((s) => this.IsPlayer(s));
          players.forEach((ctx) => {
            this.SendCall(ctx, {
              t: ROOMTYPE.NEW_ROOMRESULT,
              p: this.result,
            });
          });
        }
      }
      IGameGroupContext.SaveDatabase(this);
    }
    WSGroups.delete(this.id);
    TelemetryGroupContext.Parts--;
  }

  protected SendCall(
    call: ConnectionContext,
    { t, p }: Omit<JsonPayload<ROOMTYPE | REQTYPE>, "s">
  ) {
    return sendEncodedMessage(call, {
      t,
      s: this.id,
      p,
    });
  }
  protected SendAll({ t, p }: Omit<JsonPayload<ROOMTYPE>, "s">) {
    return publishEncodedMessage(this.id, {
      t,
      s: this.id,
      p,
    });
  }

  GetRoom(): IRoom {
    return {
      id: this.id,
      mode: this.meta.mode,
      white: { nickname: this.meta.white?.sub } as any,
      black: { nickname: this.meta.black?.sub } as any,
      clock: this.meta.clock,
      createdAt: this.meta.createdAt,
      status: this.meta.status,
      time: this.timer.GetTime,
      result: this.result || null,
      fen: this.chess.fen(),
      isPrivacy: this.meta.isPrivacy,
      messages: this.messages.map(({ sender, body }) => {
        return { sender: sender.sub || "", body };
      }),
      history: this.chess.history().map((m, i) => {
        return {
          san: m,
          clock: this.clocks[i],
        };
      }),
    };
  }

  static async SaveDatabase(room: IGameGroupContext<any>) {
    console.log("SAVE");

    let white: null | IUserDocument = null;
    if (isAuthenticated(room.meta.white))
      white = await dbContext.Users.findById(getUserId(room.meta.white));

    let black: null | IUserDocument = null;
    if (isAuthenticated(room.meta.black))
      black = await dbContext.Users.findById(getUserId(room.meta.black));

    return await dbContext.Rooms.create({
      id: room.id,
      mode: room.meta.mode,
      clock: room.meta.clock,
      time: room.timer.GetTime,
      white,
      black,
      fen: room.chess.fen(),
      isPrivacy: false,
      result: room.result,
      status: room.meta.status,
      createdAt: room.meta.createdAt,
      history: room.chess.history().map((m, i) => {
        return {
          san: m,
          clock: room.clocks[i],
        };
      }),
      messages: room.messages.map((m) => {
        return {
          sender: m.sender.sub,
          body: m.body,
        };
      }),
    });
  }
}

export default IGameGroupContext;
