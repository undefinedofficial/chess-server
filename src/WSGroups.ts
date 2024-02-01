import ConnectionContext from "./socketHelpers/ConnectionContext";
import GroupContext from "./groups/GroupContext";
import QueueGroupContext from "./groups/QueueGroupContext";
import TelemetryGroupContext from "./groups/TelemetryGroupContext";
import isGameRoom from "./groups/isGameRoom";
import IGameGroupContext from "./groups/IGameGroupContext";
import ContactGroupContext from "./groups/ContactGroupContext";

class WSGroups {
  groups = {} as Record<string, GroupContext>;

  constructor() {
    this.set(TelemetryGroupContext);
    this.set(QueueGroupContext);
    this.set(ContactGroupContext);
  }

  get(groupId: string) {
    return this.groups[groupId];
  }
  getGameRoom(roomId: string) {
    const room = this.groups[roomId];
    if (isGameRoom(room)) return room;
    return;
  }
  set(groupContext: GroupContext) {
    this.groups[groupContext.id] = groupContext;
  }
  delete(groupId: string) {
    delete this.groups[groupId];
  }
  subscribe(group: GroupContext, connectionContext: ConnectionContext, payload?: unknown) {
    if (group.handleConnect(connectionContext, payload)) {
      connectionContext.groups[group.id] = group;
      return true;
    }
    return false;
  }
  async unsubscribe(group: GroupContext, connectionContext: ConnectionContext) {
    group.handleClose(connectionContext);
    delete connectionContext.groups[group.id];
  }
  unsubscribeAll(connectionContext: ConnectionContext) {
    Object.values(connectionContext.groups).forEach((gCtx) => gCtx?.handleClose(connectionContext));
    connectionContext.groups = {};
  }

  findGameRoomsByUserId(id: string): IGameGroupContext[] {
    return Object.values(this.groups).filter(
      (g) => isGameRoom(g) && (g.meta.white?.did === id || g.meta.black?.did === id)
    ) as IGameGroupContext[];
  }
}

export default new WSGroups();
