import { ObjectId, Document } from "mongodb";
import { CHESSMODE, ROOMSTATUS, RoomResult } from "../../types/DataProto";
import { IUserDocument } from "./User";
import { Schema, model } from "mongoose";

interface Move {
  san: string;
  clock: number;
}
interface Message {
  sender: string; // User;
  body: string;
}

export interface IRoom {
  id: string;
  mode: CHESSMODE;
  clock: number;
  time: { white: number; black: number };
  white: IUserDocument | null; // null for guest rooms
  black: IUserDocument | null; // null for guest rooms
  fen: string;
  history: Move[];
  messages: Message[];
  isPrivacy: boolean;
  result: RoomResult | null;
  status: ROOMSTATUS;
  createdAt: Date;
}

export interface IRoomDocument extends Document, IRoom {}

const schema = new Schema<IRoomDocument>(
  {
    id: { type: "String", required: true },
    mode: { type: "String", required: true },
    clock: { type: "Number", required: true },
    time: {
      white: { type: "Number", required: true },
      black: { type: "Number", required: true },
    },
    white: { type: ObjectId, ref: "users", default: null },
    black: { type: ObjectId, ref: "users", default: null },
    fen: { type: "String", required: true },
    history: {
      type: [
        {
          san: { type: "String", required: true },
          clock: { type: "number", required: true },
        },
      ],
      required: true,
    },
    messages: {
      type: [
        {
          sender: { type: "String", required: true },
          body: { type: "String", required: true },
        },
      ],
      required: true,
    },
    isPrivacy: { type: "Boolean", default: false },
    result: {
      type: {
        whiteElo: { type: "Number" },
        whiteScore: { type: "Number" },
        blackElo: { type: "Number" },
        blackScore: { type: "Number" },
      },
      default: null,
    },
    status: { type: "Number", required: true },
  },
  { timestamps: true }
);

export default model("rooms", schema);
