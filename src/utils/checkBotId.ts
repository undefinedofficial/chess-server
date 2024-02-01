import type { CHESSMODE } from "../types/DataProto";

const checkBotId = (
  mode: CHESSMODE
): mode is Exclude<CHESSMODE, "BULLET10" | "BLITZ50" | "RAPID100"> => {
  mode;
  return [
    "player-1",
    "player-2",
    "player-3",
    "player-4",
    "player-5",
    "player-6",
    "player-7",
    "player-8",
    "player-9",
    "player-10",
    "player-11",
    "player-12",
    "player-13",
    "player-14",
    "player-15",
    "player-16",
    "player-17",
    "player-18",
  ].includes(mode);
};

export default checkBotId;
