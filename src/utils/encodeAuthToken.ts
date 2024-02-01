import { sign } from "jsonwebtoken";
import AuthToken from "../types/AuthToken";
import { security } from "../configs";

const secret = Buffer.from(security.TOKEN_PASS, "base64");
const encodeAuthToken = (authToken: AuthToken) => {
  return sign(JSON.parse(JSON.stringify(authToken)), secret);
};

export default encodeAuthToken;
