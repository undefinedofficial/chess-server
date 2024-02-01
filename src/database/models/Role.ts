import Permission from "../../types/Permissions";
import { Schema, Document, model } from "mongoose";

export interface IRole {
  name: string;
  description: string | null;
  permissions: Permission[] | string[];
  createdAt: Date;
}
export interface IRoleDocument extends Document, IRole {}

const schema = new Schema<IRoleDocument>(
  {
    name: { type: "String", required: true },
    description: { type: "String", default: "" },
    permissions: { type: ["String"], default: [] },
  },
  { timestamps: true }
);

export default model("roles", schema);
