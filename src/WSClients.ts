import ConnectionContext from "./socketHelpers/ConnectionContext";
import { getUserId, isAuthenticated } from "./utils/authorization";

class WSClients {
  store = {} as Record<string, ConnectionContext>;
  getByDId(dbid: string) {
    return Object.values(this.store).filter(
      (connection) =>
        isAuthenticated(connection.authToken) &&
        getUserId(connection.authToken) === dbid
    );
  }
  get(connectionId: string) {
    return this.store[connectionId];
  }
  set(connectionContext: ConnectionContext) {
    this.store[connectionContext.id] = connectionContext;
  }
  delete(connectionId: string) {
    delete this.store[connectionId];
  }
}

export default new WSClients();
