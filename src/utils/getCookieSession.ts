import { HttpRequest } from "uWebSockets.js";
import SessionToken from "../types/SessionToken";

const getCookieSession = (req: HttpRequest): SessionToken | null => {
  const cookie = req.getHeader("cookie");
  const session = cookie.replace(
    /^(.*)session=([^;]+)(.*)$/,
    (_matchedString, _match1, match2) => match2
  );
  return session.startsWith("guest") ? { sub: session, rol: "guest", did: undefined } : null;
};

export default getCookieSession;
