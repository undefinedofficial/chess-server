import { Schema, Document, model } from "mongoose";

export interface IQuestion {
  topic: string;
  email: string;
  body: string;
}

export interface IQuestionDocument extends Document, IQuestion {
  createdAt: Date;
}

const schema = new Schema<IQuestionDocument>(
  {
    topic: { type: "String", required: true },
    email: { type: "String", required: true },
    body: { type: "String", default: "" },
  },
  { timestamps: true }
);

export default model("questions", schema);
