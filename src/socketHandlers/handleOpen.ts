import { WebSocketBehavior, WebSocket } from "uWebSockets.js";
import { sendEncodedMessage } from "../socketHelpers/sendEncodedMessage";
import { version } from "../configs";
import UserData from "../socketHelpers/UserData";
import WSClients from "../WSClients";
import { JsonPayload, REQTYPE } from "../types/DataProto";
import TelemetryGroupContext from "../groups/TelemetryGroupContext";

const APP_VERSION = version;

const handleOpen: WebSocketBehavior<UserData>["open"] = async (
  socket: WebSocket<UserData>
) => {
  const { connectionContext } = socket.getUserData();
  await connectionContext.created(socket);

  WSClients.set(connectionContext);
  TelemetryGroupContext.Users++;

  sendEncodedMessage(connectionContext, {
    v: APP_VERSION,
    t: REQTYPE.AUTH,
    p: connectionContext.nickname,
  } as JsonPayload<REQTYPE>);
};

export default handleOpen;
