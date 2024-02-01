import ConnectionContext from "../socketHelpers/ConnectionContext";
import randomString from "../utils/randomString";
import { Token } from "../types/Token";
import { PartialMove } from "chess.ts";
import IGameGroupContext from "./IGameGroupContext";
import { CHESSMODE, ROOMSTATUS, ROOMTYPE, ROOMCLAIMS, RoomJson } from "../types/DataProto";
import GameTimer, { Directions } from "../helpers/GameTimer";
import { IRoom } from "../database/models/Room";

interface Options {
  mode: CHESSMODE;
  white: Token;
  black: Token;
  room_id?: string; // room always begined 'o' for online or 'b' for bots
  fen?: string;
  isReward?: boolean;
}

const firstMove = 20000;

interface Claim {
  type: ROOMCLAIMS.CLAIM_BACK | ROOMCLAIMS.CLAIM_DRAW;
  sender: Token;
  receiver: Token;
}

class OnlineGameGroupContext extends IGameGroupContext<GameTimer> {
  private claim?: Claim;

  constructor(options: Options) {
    const { room_id = "o" + randomString(11), mode, white, black, fen, isReward } = options;

    let clock: number;
    switch (mode) {
      case "BULLET10":
        clock = 60000;
        break;
      case "BLITZ50":
        clock = 300000;
        break;
      case "RAPID100":
        clock = 600000;
        break;

      default:
        console.warn("OnlineGameGroupContext: create mode unsupported");
        clock = 60000;
        break;
    }

    super({
      room_id,
      mode,
      fen,
      isReward,
      clock,
      white,
      black,
    });
    this.timer = new GameTimer(
      { direction: Directions.BACKWARD, tBlack: clock, tWhite: clock },
      () => {
        this.GameOver(this.chess.turn() === "w" ? ROOMSTATUS.BLACK_WIN : ROOMSTATUS.WHITE_WIN);
      }
    );
  }

  //#region Timers
  /* Only one active timer */
  private confirm = new GameTimer(
    { direction: Directions.BACKWARD, tWhite: firstMove, tBlack: firstMove },
    async () => {
      await this.GameOver(
        this.confirm.Turn == "w" ? ROOMSTATUS.WHITE_SURRENDER : ROOMSTATUS.BLACK_SURRENDER
      );
    }
  );
  /**
   * First white move timer
   */
  private ActivatedWhite() {
    this.confirm.Turn = "w";
    this.confirm.Play = true;
  }
  /**
   * First black move timer
   */
  private ActivatedBlack() {
    this.confirm.Turn = "b";
    this.confirm.Play = true;
  }
  /**
   * All next moves
   */
  private ActivatedMain() {
    this.confirm.Reset();
    this.confirm.Play = false;
    this.timer.Play = true;
  }
  protected OnStopTimer(): void {
    this.confirm.Play = false;
    this.timer.Play = false;
  }
  //#endregion

  handleConnect(ctx: ConnectionContext): boolean {
    this.JoinUser(ctx);
    if (this.meta.status > ROOMSTATUS.INSUFFICIENT) return true;

    /** find players */
    const players = this.subs.filter((u) => this.IsPlayer(u));
    if (players.length > 1) {
      /**
       * Continue count time, else activate first move timer
       */
      if (this.meta.status === ROOMSTATUS.INSUFFICIENT) {
        /**
         * run confirmation or main timer
         */
        if (this.clocks.length > 1) this.timer.Play = true;
        else this.confirm.Play = true;
      } else {
        this.ActivatedWhite();
      }
      this.SendStatus(ROOMSTATUS.PROCESSED);
    }

    return true;
  }
  handleMessage(ctx: ConnectionContext, type: number, payload: unknown): boolean {
    const NewHistory = () => {
      const move = payload as PartialMove;
      if (typeof move?.from !== "string" || typeof move?.to !== "string") return true;

      if (this.chess.turn() === "w" && !this.IsWhitePlayer(ctx)) return true;
      else if (this.chess.turn() === "b" && !this.IsBlackPlayer(ctx)) return true;

      if (!this.NextMove(move)) return true;

      /** Check starting timer for first move black */
      if (this.clocks.length === 1) {
        this.ActivatedBlack();
        return true;
      }
      /** Check starting timer main fot all moves */
      if (this.clocks.length === 2) {
        this.ActivatedMain();
        return true;
      }
      /* Check continued */
      if (!this.chess.gameOver()) return true;

      /* Game over check status */
      if (this.chess.inCheckmate()) {
        this.GameOver(this.chess.turn() === "w" ? ROOMSTATUS.BLACK_WIN : ROOMSTATUS.WHITE_WIN);
        return true;
      }
      if (this.chess.inDraw()) {
        this.GameOver(ROOMSTATUS.STALEMATE);
      }
      return true;
    };
    const NewMessage = () => {
      if (typeof payload !== "string") return true;

      if (!this.IsPlayer(ctx)) return true;

      this.messages.push({
        sender: ctx.authToken,
        body: payload,
      });
      this.SendAll({
        t: ROOMTYPE.NEW_MESSAGE,
        p: {
          sender: ctx.nickname,
          body: payload,
        },
      });
      return true;
    };
    const RoomClaim = () => {
      if (!this.IsPlayer(ctx)) return true;
      switch (payload) {
        case ROOMCLAIMS.CLAIM_DRAW:
        case ROOMCLAIMS.CLAIM_BACK:
        case ROOMCLAIMS.CLAIM_REPLAY:
          if (!this.IsPlayer(ctx)) return true;

          if (payload === ROOMCLAIMS.CLAIM_REPLAY && !(this.meta.status > ROOMSTATUS.PROCESSED))
            return true;

          const opponent = this.IsWhitePlayer(ctx) // find invert
            ? this.subs.find((s) => s.nickname === this.meta.black?.sub) // find black
            : this.subs.find((s) => s.nickname === this.meta.white?.sub); // or white player

          if (opponent) {
            this.claim = {
              type: payload as any,
              sender: ctx.authToken,
              receiver: opponent.authToken,
            };

            this.SendCall(opponent, { t: ROOMTYPE.ROOM_CLAIM, p: payload });
            return true;
          }

          this.SendCall(ctx, {
            t: ROOMTYPE.ROOM_CLAIM,
            p: ROOMCLAIMS.CLAIM_REJECT,
          });
          return true;

        case ROOMCLAIMS.CLAIM_SERRENDER:
          if (!this.IsPlayer(ctx)) break;
          if (this.meta.status !== ROOMSTATUS.PROCESSED) break;

          this.GameOver(this.IsWhitePlayer(ctx) ? ROOMSTATUS.BLACK_WIN : ROOMSTATUS.WHITE_WIN);
          return true;
      }
      return true;
    };
    const NewClaim = () => {
      if (this.meta.status !== ROOMSTATUS.PROCESSED || !this.IsPlayer(ctx) || !this.claim)
        return true;

      if (payload === ROOMCLAIMS.CLAIM_REJECT) {
        const senderCtx = this.subs.find((s) => s.authToken.sub === this.claim!.sender.sub);
        if (senderCtx)
          this.SendCall(senderCtx, {
            t: ROOMTYPE.NEW_CLAIM,
            p: ROOMCLAIMS.CLAIM_REJECT,
          });
      } else {
        switch (this.claim!.type) {
          case ROOMCLAIMS.CLAIM_BACK:
            this.UndoMove();
            break;

          case ROOMCLAIMS.CLAIM_DRAW:
            this.GameOver(ROOMSTATUS.STALEMATE_SURRENDER);
            break;
        }
      }
      this.claim = undefined;
      return true;
    };
    switch (type) {
      case ROOMTYPE.NEW_HISTORY:
        return NewHistory();
      case ROOMTYPE.NEW_MESSAGE:
        return NewMessage();
      case ROOMTYPE.ROOM_CLAIM:
        return RoomClaim();
      case ROOMTYPE.NEW_CLAIM:
        return NewClaim();
    }
    return false;
  }
  handleClose(ctx: ConnectionContext): void {
    this.LeaveUser(ctx);
    if (this.meta.status === ROOMSTATUS.PROCESSED) {
      /** find players */
      const players = this.subs.filter((u) => this.IsPlayer(u));
      if (players.length < 2) {
        this.SendStatus(ROOMSTATUS.INSUFFICIENT);
        this.timer.Play = false;
        this.confirm.Play = false;
      }
    }
  }

  GetRoom(): IRoom {
    const time =
      this.clocks.length > 1
        ? this.timer.GetTime
        : {
            ...this.timer.GetTime,
            cWhite: this.confirm.GetTimeWhite,
            cBlack: this.confirm.GetTimeBlack,
          };
    return {
      id: this.id,
      mode: this.meta.mode,
      white: { nickname: this.meta.white?.sub } as any,
      black: { nickname: this.meta.black?.sub } as any,
      clock: this.meta.clock,
      createdAt: this.meta.createdAt,
      status: this.meta.status,
      time: time,
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
}

export default OnlineGameGroupContext;
