import { WebSocket } from "uWebSockets.js";
import sendToSentry from "../utils/sendToSentry";
import UserData from "../socketHelpers/UserData";
import ConnectionContext from "../socketHelpers/ConnectionContext";
import { JsonPayload, REQTYPE } from "../types/DataProto";
import WSGroups from "../WSGroups";
import { sendEncodedMessage } from "../socketHelpers/sendEncodedMessage";

// const typetext = {
//   [REQTYPE.JOIN_ROOM]: "JOIN ROOM",
//   [REQTYPE.LEAVE_ROOM]: "LEAVE ROOM",
// };

const handleParsedMessage = (
  { t, p, s }: JsonPayload<REQTYPE>,
  connectionContext: ConnectionContext
): boolean => {
  // console.log(
  //   "MESSAGE",
  //   { type: typetext[t], paylod: p, sub: s },
  //   connectionContext.id
  // );

  switch (t) {
    case REQTYPE.JOIN_ROOM: {
      const group = WSGroups.get(s);
      if (!group || !WSGroups.subscribe(group, connectionContext, p))
        sendEncodedMessage(connectionContext, {
          t: REQTYPE.BAD,
        } as JsonPayload<REQTYPE>);

      return true;
    }
    case REQTYPE.LEAVE_ROOM: {
      const group = WSGroups.get(s);
      if (group) WSGroups.unsubscribe(group, connectionContext);

      return true;
    }
  }
  return false;
};

const handleMessage = (
  websocket: WebSocket<UserData>,
  message: ArrayBuffer
) => {
  const { connectionContext } = websocket.getUserData();
  let parsedMessage: JsonPayload<number>;
  try {
    parsedMessage = JSON.parse(Buffer.from(message).toString());
  } catch (e) {
    // ignore the message
    return;
  }
  // ignore bad message
  if (
    typeof parsedMessage.t !== "number" ||
    typeof parsedMessage.s !== "string"
  )
    return;

  // send default handler
  if (!handleParsedMessage(parsedMessage, connectionContext)) {
    // send subs handler
    connectionContext.groups[parsedMessage.s]?.handleMessage(
      connectionContext,
      parsedMessage.t,
      parsedMessage.p
    );
  }
};

const safeHandleMessage = (websocket: WebSocket<any>, message: ArrayBuffer) => {
  try {
    handleMessage(websocket, message);
  } catch (e) {
    const error =
      e instanceof Error ? e : new Error("handleMessage failed" + message);
    sendToSentry(error);
  }
};
export default safeHandleMessage;
