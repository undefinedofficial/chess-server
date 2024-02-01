import { verify } from "jsonwebtoken";
import AuthToken from "../types/AuthToken";
import sendToSentry from "./sendToSentry";
import { security } from "../configs";

const SERVER_SECRET_BUFFER = Buffer.from(security.TOKEN_PASS, "base64");

const getVerifiedAuthToken = (jwt: string | undefined | null, ignoreExp?: boolean) => {
  if (!jwt) {
    return null;
  }
  try {
    return verify(jwt, SERVER_SECRET_BUFFER, {
      ignoreExpiration: ignoreExp,
    }) as AuthToken;
  } catch (e) {
    //const error = e instanceof Error ? e : new Error("Verify auth token failed");
    //sendToSentry(error, { tags: { jwt } });
    return null;
  }
};

export default getVerifiedAuthToken;
