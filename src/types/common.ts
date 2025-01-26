import { Document, Types } from "mongoose";

export interface BaseDocument extends Document {
    createdAt: Date;
    updatedAt: Date;
}

export type ID = Types.ObjectId;
