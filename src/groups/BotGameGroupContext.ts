import ConnectionContext from "../socketHelpers/ConnectionContext";
import { Color, CHESSMODE, ROOMSTATUS, ROOMTYPE, ROOMCLAIMS } from "../types/DataProto";
import randomString from "../utils/randomString";
import { Token } from "../types/Token";
import { PartialMove } from "chess.ts";
import IGameGroupContext from "./IGameGroupContext";
import GameTimer, { Directions } from "../helpers/GameTimer";

interface Options {
  mode: CHESSMODE;
  player: Token;
  color: Color;
  clock?: number;
  room_id?: string; // room always begined 'o' for online or 'b' for bots
  fen?: string;
  isReward?: boolean;
}

class BotGameGroupContext extends IGameGroupContext<GameTimer> {
  readonly orientation: Exclude<Color, "wb">; // user selected color
  constructor(options: Options) {
    const {
      room_id = "b" + randomString(11),
      mode,
      player,
      clock = 0,
      color,
      fen,
      isReward,
    } = options;

    const orientation = color === "wb" ? (Math.random() > 0.5 ? "w" : "b") : color;

    super({
      room_id,
      mode,
      fen,
      isReward,
      clock,
      white: orientation === "w" ? player : undefined,
      black: orientation === "b" ? player : undefined,
    });

    this.timer = new GameTimer(
      { direction: Directions.FORWARD, tBlack: clock, tWhite: clock },
      () => {
        this.GameOver(this.chess.turn() === "w" ? ROOMSTATUS.BLACK_WIN : ROOMSTATUS.WHITE_WIN);
      }
    );
    this.orientation = orientation;
  }

  handleConnect(ctx: ConnectionContext): boolean {
    this.JoinUser(ctx);

    if (this.meta.status < ROOMSTATUS.PROCESSED) {
      const player = this.subs.find((u) => this.IsPlayer(u));
      if (player) {
        this.SendStatus(ROOMSTATUS.PROCESSED);
        this.timer.Play = true;
      }
    }
    return true;
  }
  handleMessage(ctx: ConnectionContext, type: number, payload: unknown): boolean {
    if (!this.IsPlayer(ctx)) {
      console.log("move forbidden", ctx.authToken, this.meta.white, this.meta.black);
      return true;
    }
    switch (type) {
      case ROOMTYPE.NEW_HISTORY:
        const move = payload as PartialMove;
        if (typeof move?.from !== "string" || typeof move?.to !== "string") return true;

        if (!this.NextMove(move)) return true;

        /* Check continued */
        if (!this.chess.gameOver()) return true;

        /* Game over check status */
        if (this.chess.inCheckmate())
          this.GameOver(this.chess.turn() === "w" ? ROOMSTATUS.BLACK_WIN : ROOMSTATUS.WHITE_WIN);
        else if (this.chess.inDraw()) this.GameOver(ROOMSTATUS.STALEMATE);
        return true;
      case ROOMTYPE.NEW_MESSAGE:
        if (typeof payload !== "string") return true;
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
      case ROOMTYPE.ROOM_CLAIM:
        if (this.meta.status !== ROOMSTATUS.PROCESSED) return true;

        switch (payload) {
          case ROOMCLAIMS.CLAIM_DRAW:
            this.GameOver(ROOMSTATUS.STALEMATE_SURRENDER);
            return true;

          case ROOMCLAIMS.CLAIM_BACK:
            this.UndoMove();
            if (this.orientation !== this.chess.turn()) this.UndoMove();
            return true;

          case ROOMCLAIMS.CLAIM_SERRENDER:
            this.GameOver(this.orientation === "w" ? ROOMSTATUS.BLACK_WIN : ROOMSTATUS.WHITE_WIN);
            return true;

          case ROOMCLAIMS.CLAIM_REPLAY:
            console.log("BotGameGroupContext.handleMessage.ROOMCLAIMS.CLAIM_REPLAY: What ???");
            return true;
        }
    }
    return true;
  }
  handleClose(ctx: ConnectionContext): void {
    this.LeaveUser(ctx);
    if (this.meta.status === ROOMSTATUS.PROCESSED) {
      const player = this.subs.find((u) => this.IsPlayer(u));
      if (!player) {
        this.SendStatus(ROOMSTATUS.INSUFFICIENT);
        this.timer.Play = false;
      }
    }
  }
}

export default BotGameGroupContext;
