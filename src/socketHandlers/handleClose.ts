import WSClients from "../WSClients";
import { WebSocket } from "uWebSockets.js";
import sendToSentry from "../utils/sendToSentry";
import UserData from "../socketHelpers/UserData";
import TelemetryGroupContext from "../groups/TelemetryGroupContext";
import WSGroups from "../WSGroups";

const handleClose = async (ws: WebSocket<UserData>) => {
  const ud = ws.getUserData();
  if (!ud.connectionContext) return;
  ud.done = true;
  try {
    TelemetryGroupContext.Users = TelemetryGroupContext.Users - 1;
    WSGroups.unsubscribeAll(ud.connectionContext);
    await ud.connectionContext.destroyed();
    WSClients.delete(ud.connectionContext.id);
  } catch (e) {
    const error = e instanceof Error ? e : new Error("handleClose failed");
    sendToSentry(error);
  }
};
export default handleClose;
