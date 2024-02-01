import { parse } from "querystring";
import { HttpRequest } from "uWebSockets.js";
import getVerifiedAuthToken from "./getVerifiedAuthToken";

const getQueryToken = (req: HttpRequest, ignoreExp?: boolean) => {
  const query = req.getQuery();
  const { token } = parse(query);
  return getVerifiedAuthToken(token as string, ignoreExp);
};

export default getQueryToken;
