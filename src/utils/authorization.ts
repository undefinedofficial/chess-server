import { Token } from "../types/Token";
import AuthToken from "../types/AuthToken";
import { version } from "../configs";

export const getUserId = (authToken: AuthToken) => {
  if (typeof authToken === "object") {
    if (authToken.did) return authToken.did;
  }
  throw new Error("getUserId: No auth token");
};

// export const getUserNick = (authToken: AuthToken) => {
//   if (typeof authToken === "object") {
//     if (authToken.sub) return authToken.sub;
//   }
//   throw new Error("getUserNick: No auth token");
// };

export const getUserRoleId = (authToken: AuthToken) => {
  if (typeof authToken === "object") {
    return authToken.rol;
  }
  throw new Error("getUserNick: No auth token");
};

export const isAuthenticated = (authToken?: Token | null): authToken is AuthToken => {
  return (
    typeof authToken?.did === "string" && authToken?.rol !== "guest" && authToken?.iss === version
  );
};

export const isSuperUser = (authToken: AuthToken) => {
  const userId = getUserId(authToken);
  return userId ? authToken.rol === "su" : false;
};
