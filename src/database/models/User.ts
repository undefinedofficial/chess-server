import { IRoleDocument } from "./Role";
import generateHash from "../../utils/generateHash";
import { Model, Schema, Document, model, QueryWithHelpers } from "mongoose";
import { ObjectId } from "mongodb";

export interface User {
  email: string;
  updateEmail: Date;

  password: string;
  updatePassword: Date;

  confirmed: boolean;
  confirmHash?: string;

  ban: boolean;
  banCount: number;

  nickname: string;
  updateNickname: Date;

  avatar?: string;
  location: string;
  lastOnline: Date | boolean;

  bonuses: string[];
  friends: IUserDocument[];
  role: IRoleDocument | null;

  name: {
    last: string;
    first: string;
  };

  elo: number;
  winBattle: number;
  lossBattle: number;
  drawBattle: number;
}

interface IUserDocument extends Document, User {
  createdAt: Date;
  updatedAt: Date;
}

// Put all user instance methods in this interface:
interface IUserMethods {
  switchOnline(isOnline: boolean): Promise<void>;
  updateAvatar(path?: string): Promise<void>;
}

// Put all user instance methods in this interface:
interface IUserStaticMethods {
  findByEmail(
    email: string
  ): QueryWithHelpers<
    (IUserDocument & IUserMethods) | null,
    IUserDocument & IUserMethods,
    {},
    IUserDocument
  >;

  findByNickname(
    nickname: string
  ): QueryWithHelpers<
    (IUserDocument & IUserMethods) | null,
    IUserDocument & IUserMethods,
    {},
    IUserDocument
  >;
}

type UserModel = Model<IUserDocument, {}, IUserMethods>;

export { IUserDocument, UserModel };

const schema = new Schema<
  IUserDocument & IUserMethods,
  UserModel,
  IUserMethods,
  {},
  {},
  IUserStaticMethods
>(
  {
    email: { type: "String", required: true, unique: true, index: true },
    updateEmail: { type: "Date", default: new Date() },

    password: { type: "String", required: true },
    updatePassword: { type: "Date", default: new Date() },

    confirmed: { type: "Boolean", default: false },
    confirmHash: { type: "String", default: "" },

    ban: { type: "Boolean", default: false },
    banCount: { type: "Number", default: 0 },

    nickname: { type: "String", required: true, unique: true, index: true },
    updateNickname: { type: "Date", default: new Date() },

    avatar: { type: "String" },
    location: { type: "String", required: true },
    lastOnline: { type: Schema.Types.Mixed, default: new Date() },

    bonuses: { type: ["String"], default: [] },
    friends: [{ type: ObjectId, ref: "users" }],

    role: { type: ObjectId, ref: "roles", default: null },

    name: {
      first: { type: String, default: "", trim: true },
      last: { type: String, default: "", trim: true },
    },

    elo: { type: "Number", default: 1000 },
    winBattle: { type: "Number", default: 0 },
    lossBattle: { type: "Number", default: 0 },
    drawBattle: { type: "Number", default: 0 },
  },
  {
    timestamps: true,
    methods: {
      async switchOnline(isOnline: boolean) {
        this.lastOnline = isOnline ? true : new Date();
        await this.save();
      },
      async updateAvatar(filename?: string) {
        this.avatar = filename;
        await this.save();
      },
    },
    statics: {
      findByEmail(email: string) {
        return this.findOne({ email });
      },
      findByNickname(nickname: string) {
        return this.findOne({ nickname });
      },
    },
  }
);

schema.pre("save", function (next) {
  if (this.isModified("email")) {
    this.updateEmail = new Date();
  }
  if (this.isModified("nickname")) {
    this.updateNickname = new Date();
  }
  if (this.isModified("password")) {
    this.password = generateHash(this.password);
    this.updatePassword = new Date();
  }
  next();
});

export default model("users", schema);
