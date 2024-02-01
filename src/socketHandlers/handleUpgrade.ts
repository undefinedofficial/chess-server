import { WebSocketBehavior } from "uWebSockets.js";
import { isAuthenticated } from "../utils/authorization";
import sendToSentry from "../utils/sendToSentry";
import getIP from "../utils/getIP";
import UserData from "../socketHelpers/UserData";
import getCookieToken from "../utils/getCookieToken";
import getCookieSession from "../utils/getCookieSession";
import randomString from "../utils/randomString";
import { Token } from "../types/Token";
import ConnectionContext from "../socketHelpers/ConnectionContext";

const handleUpgrade: WebSocketBehavior<UserData>["upgrade"] = async (res, req, context) => {
  const protocol = req.getHeader("sec-websocket-protocol");
  if (protocol !== "chesswood-ws") {
    sendToSentry(new Error(`WebSocket error: invalid protocol: ${protocol}`));
    // WS Error 1002 is roughly HTTP 412 Precondition Failed because we can't support the req header
    res.writeStatus("412").end();
    return;
  }
  let authToken: Token | null = getCookieToken(req);
  if (!isAuthenticated(authToken)) {
    authToken = getCookieSession(req);
    if (!authToken) authToken = { sub: "guest" + randomString(), rol: "guest" };
  }

  // res.onAborted(() => {
  //   res.aborted = true;
  // });

  const key = req.getHeader("sec-websocket-key");
  const extensions = req.getHeader("sec-websocket-extensions");
  const ip = getIP(res, req);
  // const { sub: userId, iat } = authToken;
  // ALL async calls must come after the message listener, or we'll skip out on messages (e.g. resub after server restart)
  // const isBlacklistedJWT = await checkBlacklistJWT(userId, iat);
  // if (res.aborted) return;
  // if (isBlacklistedJWT) {
  // res.writeStatus("401").end(TrebuchetCloseReason.EXPIRED_SESSION);
  // return;
  // }

  res.upgrade<UserData>(
    { connectionContext: new ConnectionContext(authToken, ip) },
    key,
    protocol,
    extensions,
    context
  );
};

export default handleUpgrade;
