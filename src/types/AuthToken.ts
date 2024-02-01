interface AuthToken {
  did?: string | undefined; // database id
  rol?: "su" | string; // role
  emp?: string | undefined; // employee
  iss?: string | undefined;
  sub?: string | undefined;
  aud?: string | string[] | undefined;
  exp?: number | undefined;
  nbf?: number | undefined;
  iat?: number | undefined;
  jti?: string | undefined;
}

export default AuthToken;
