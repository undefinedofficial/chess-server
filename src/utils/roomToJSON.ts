import { IRoom } from "../database/models/Room";
import { RoomJson } from "../types/DataProto";

function roomsToJSON<T extends IRoom | IRoom[]>(rooms: T): RoomJson | RoomJson[] {
  debugger;
  function select(room: IRoom): RoomJson {
    debugger;
    return {
      id: room.id,
      mode: room.mode,
      fen: room.fen,
      clock: room.clock,
      createdAt: room.createdAt,
      status: room.status,
      time: room.time,

      white: room.white?.nickname || undefined,
      black: room.black?.nickname || undefined,

      history: room.history.map(({ san, clock }) => ({ san, clock })),
      messages: room.messages.map(({ body, sender }) => ({ body, sender })),
      result: room.result
        ? {
            whiteElo: room.result.whiteElo,
            whiteScore: room.result.whiteScore,
            blackElo: room.result.blackElo,
            blackScore: room.result.blackScore,
          }
        : undefined,
    };
  }

  if (Array.isArray(rooms)) return rooms.map(select);
  return select(rooms);
}

export default roomsToJSON;
