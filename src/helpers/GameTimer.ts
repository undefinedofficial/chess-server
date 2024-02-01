import { Color } from "../types/DataProto";

type Turn = Exclude<Color, "wb">;

const enum Directions {
  BACKWARD = -1,
  FORWARD = 1,
}

type timeOver = () => void;

interface Options {
  direction: Directions;
  play?: boolean;
  turn?: Turn;
  tWhite?: number;
  tBlack?: number;
}

class GameTimer {
  _timeOverFn: timeOver;
  _hTimer: NodeJS.Timeout;
  direction: Directions;

  turn: Turn;
  public get Turn(): Turn {
    return this.turn;
  }
  public set Turn(turn: Turn) {
    this.turn = turn;
  }

  tWhite: number;
  public get GetTimeWhite() {
    return this.tWhite;
  }
  tBlack: number;
  public get GetTimeBlack() {
    return this.tBlack;
  }
  public get GetTime() {
    return {
      white: this.tWhite,
      black: this.tBlack,
    };
  }

  public Reset(white = 0, black = 0) {
    this.tWhite = white;
    this.tBlack = black;
  }

  _isPlay: boolean;
  public get Play() {
    return this._isPlay;
  }
  public set Play(is: boolean) {
    if (this._isPlay === is) return;
    this._isPlay = is;
    this._isPlay ? this.StartTimer() : this.StopTimer();
  }

  protected StartTimer() {
    this.StopTimer();
    let lastTime = Date.now();
    this._hTimer = setInterval(() => {
      const offset = Date.now() - lastTime;
      lastTime = Date.now();

      if (this.turn === "w") {
        this.tWhite += this.direction === 1 ? offset : -offset;
        if (this.tWhite > 0) return;
      } else {
        this.tBlack += this.direction === 1 ? offset : -offset;
        if (this.tBlack > 0) return;
      }

      this.StopTimer();
      this._timeOverFn();
    }, 100);
  }
  protected StopTimer() {
    if (this._hTimer) clearInterval(this._hTimer);
  }

  constructor(opts: Options, timeOver: timeOver) {
    this.direction = opts.direction;
    this.Play = opts.play || false;
    this.tWhite = opts.tWhite || 0;
    this.tBlack = opts.tBlack || 0;
    this.turn = opts.turn || "w";
    this._timeOverFn = timeOver;
  }
}

export { Directions, Turn };

export default GameTimer;
