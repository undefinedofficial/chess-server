import { Groups } from "../types/DataProto";
import ConnectionContext from "../socketHelpers/ConnectionContext";
import randomString from "../utils/randomString";

interface Options {
  id?: Groups;
}

abstract class GroupContext {
  id: Groups;
  constructor(options: Options = {}) {
    const { id = `group_${randomString()}` } = options;
    this.id = id;
  }

  abstract handleConnect(ctx: ConnectionContext, payload?: unknown): boolean;
  abstract handleMessage(ctx: ConnectionContext, type: number, payload: unknown): boolean;
  abstract handleClose(ctx: ConnectionContext): void;
}

export default GroupContext;
