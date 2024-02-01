interface SessionToken {
  rol?: `guest${string}`; // role
  did: undefined;
  sub: string;
}

export default SessionToken;
