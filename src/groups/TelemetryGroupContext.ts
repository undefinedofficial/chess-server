import { type DataTelemetry, REQTYPE, STATUSTELEMETRY } from "../types/DataProto";
import ConnectionContext from "../socketHelpers/ConnectionContext";
import { publishEncodedMessage, sendEncodedMessage } from "../socketHelpers/sendEncodedMessage";
import GroupContext from "./GroupContext";
import dbContext from "../database/dbContext";

const TOPIC_TELEMETRY = "tlmtry";

class TelemetryGroupContext extends GroupContext {
  private users: number = 0;
  public get Users(): number {
    return this.users;
  }
  public set Users(value: number) {
    if (value < 0) return;
    this.users = value;
    publishEncodedMessage(TOPIC_TELEMETRY, {
      t: -1,
      s: TOPIC_TELEMETRY,
      p: [{ type: STATUSTELEMETRY.USERS, update: value } as DataTelemetry],
    });
  }

  private parts: number = 0;
  public get Parts(): number {
    return this.parts;
  }
  public set Parts(value: number) {
    if (value < 0) return;
    this.parts = value;
    publishEncodedMessage(TOPIC_TELEMETRY, {
      t: -1,
      s: TOPIC_TELEMETRY,
      p: [{ type: STATUSTELEMETRY.PARTS, update: value } as DataTelemetry],
    });
  }

  private players: number = 0;
  public get Players(): number {
    return this.players;
  }
  public set Players(value: number) {
    if (value < 0) return;
    this.players = value;
    publishEncodedMessage(TOPIC_TELEMETRY, {
      t: -1,
      s: TOPIC_TELEMETRY,
      p: [{ type: STATUSTELEMETRY.PLAYERS, update: value } as DataTelemetry],
    });
  }

  private bullet: number = 0;
  public get Bullet(): number {
    return this.bullet;
  }
  public set Bullet(value: number) {
    if (value < 0) return;
    this.bullet = value;
    publishEncodedMessage(TOPIC_TELEMETRY, {
      t: -1,
      s: TOPIC_TELEMETRY,
      p: [{ type: STATUSTELEMETRY.BULLET, update: value } as DataTelemetry],
    });
  }

  private blitz: number = 0;
  public get Blitz(): number {
    return this.blitz;
  }
  public set Blitz(value: number) {
    if (value < 0) return;
    this.blitz = value;
    publishEncodedMessage(TOPIC_TELEMETRY, {
      t: -1,
      s: TOPIC_TELEMETRY,
      p: [{ type: STATUSTELEMETRY.BLITZ, update: value } as DataTelemetry],
    });
  }

  private rapid: number = 0;
  public get Rapid(): number {
    return this.rapid;
  }
  public set Rapid(value: number) {
    if (value < 0) return;
    this.rapid = value;
    publishEncodedMessage(TOPIC_TELEMETRY, {
      t: -1,
      s: TOPIC_TELEMETRY,
      p: [{ type: STATUSTELEMETRY.RAPID, update: value } as DataTelemetry],
    });
  }
  private queue: number = 0;
  public get Queue(): number {
    return this.queue;
  }
  public set Queue(value: number) {
    this.queue = value;
    publishEncodedMessage(TOPIC_TELEMETRY, {
      t: -1,
      s: TOPIC_TELEMETRY,
      p: [{ type: STATUSTELEMETRY.RAPID, update: value } as DataTelemetry],
    });
  }

  constructor() {
    super({ id: TOPIC_TELEMETRY });
    dbContext.Rooms.countDocuments((err, count) => {
      if (err) {
        console.warn(err);
        return;
      }
      this.Parts = count;
    });
  }
  handleConnect(ctx: ConnectionContext): boolean {
    sendEncodedMessage(ctx, {
      t: REQTYPE.JOIN_ROOM,
      s: this.id,
      p: this.AllData(),
    });
    ctx.socket.subscribe(TOPIC_TELEMETRY);
    return true;
  }
  handleMessage(_ctx: ConnectionContext, _type: number, _payload: unknown): boolean {
    return true;
  }
  handleClose(ctx: ConnectionContext): void {
    const { done } = ctx.socket.getUserData();
    if (done) return;
    ctx.socket.unsubscribe(TOPIC_TELEMETRY);
  }

  AllData(): DataTelemetry[] {
    return [
      {
        type: STATUSTELEMETRY.USERS,
        update: this.users,
      },
      {
        type: STATUSTELEMETRY.PARTS,
        update: this.parts,
      },
      {
        type: STATUSTELEMETRY.PLAYERS,
        update: this.players,
      },
      {
        type: STATUSTELEMETRY.BULLET,
        update: this.bullet,
      },
      {
        type: STATUSTELEMETRY.RAPID,
        update: this.rapid,
      },
      {
        type: STATUSTELEMETRY.BLITZ,
        update: this.blitz,
      },
    ];
  }
}

export default new TelemetryGroupContext();
