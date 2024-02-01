import { HttpRequest } from "uWebSockets.js";
import getVerifiedAuthToken from "./getVerifiedAuthToken";
import getCookie from "./getCookie";

const getCookieToken = (req: HttpRequest, ignoreExp?: boolean) => {
  const token = getCookie(req, "token");
  return getVerifiedAuthToken(token as string, ignoreExp);
};

export default getCookieToken;
