import { WebSocket } from "uWebSockets.js";
import { JsonPayload } from "../types/DataProto";
import ConnectionContext from "./ConnectionContext";
import app from "../App";

const ESTIMATED_MTU = 1400;

const sendEncodedMessageBasedOnSocket = (socket: WebSocket<any>, message: string) => {
  return socket.send(message, false, message.length > ESTIMATED_MTU);
};

const sendEncodedMessage = (
  { socket }: ConnectionContext,
  object: JsonPayload<number>
) => {
  const { done } = socket.getUserData();
  if (done) return false;

  const message = JSON.stringify(object);
  return sendEncodedMessageBasedOnSocket(socket, message);
};
const publishEncodedMessage = (topic: string, object: JsonPayload<number>) => {
  const message = JSON.stringify(object);
  return app.publish(topic, message, false, message.length > ESTIMATED_MTU);
};

export { sendEncodedMessage, publishEncodedMessage };
