import { model } from "mongoose";
import { IUser, IUserInterestCategory, IDodoPage } from "../../types/user";
import {
    userSchema,
    userInterestCategorySchema,
    dodoPageSchema,
} from "./schema";

const UserModel = model<IUser>("User", userSchema);
const UserInterestCategoryModel = model<IUserInterestCategory>(
    "UserInterestCategory",
    userInterestCategorySchema
);
const DodoPageModel = model<IDodoPage>("DodoPage", dodoPageSchema);

export { UserModel, UserInterestCategoryModel, DodoPageModel };
