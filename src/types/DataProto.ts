import {
  type DataTelemetry,
  type Groups,
  type JsonPayload,
  type Color,
  type GameMode,
  type RoomTime,
  type RoomResult,
  type CHESSMODE,
  type RoomMeta,
  type Message as ClientMessage,
  RoomJson,
  REQTYPE,
  BATTLETYPE,
  STATUSTELEMETRY,
  ROOMTYPE,
  ROOMCLAIMS,
  ROOMSTATUS,
  RequestBattle,
} from "../../../chesswood-ts/src/types/ws.d";

import { Token } from "./Token";

interface Message extends Omit<ClientMessage, "isSelf" | "sender"> {
  sender: Token;
}

export type {
  ClientMessage,
  Message,
  DataTelemetry,
  Groups,
  JsonPayload,
  Color,
  GameMode,
  RoomTime,
  RoomResult,
  CHESSMODE,
  RoomMeta,
  RoomJson,
  RequestBattle,
};

export { REQTYPE, BATTLETYPE, STATUSTELEMETRY, ROOMTYPE, ROOMCLAIMS, ROOMSTATUS };
